import { ApplicationData, IframeDebuggerConfig, PostMessageType, UIManagerConfig } from '@grootio/common';

import { resetWatch, outerSelected, updateActiveRect, respondDragOver, respondDragEnter, respondDragLeave, respondDragDrop } from './monitor';
import { controlMode, globalConfig, groot, setConfig } from './config';
import { View } from './View';
import { buildResource } from './resource';

export enum ApplicationStatus {
  Init = 'init',
  BeforeLoading = 'before_loading',
  Loading = 'loading',
  Finish = 'finish',
  Fail = 'fail'
}

// 应用实例对象
const instance = {
  status: ApplicationStatus.Init,
  loadApp: loadApplication,
  hasView,
  getView,
  viewLoading,
  loadView,
  beforeLoadAppPromise: Promise.resolve(),
  loadAppPromise: Promise.resolve(),
  unloadView,

  groot
};

export type ApplicationInstance = typeof instance;

let iframeApplicationLoadResolve: (info: ApplicationData) => void;
let iframeDebuggerConfig: IframeDebuggerConfig;
// 当前激活的界面视图
let activeViewMap: Map<string, View> = new Map()
let activeMainEntryView: View;
// 包含所有界面视图
const allViewMap = new Map<string, View>();
const loadingViewMap = new Map<string, Promise<any>>()


export function bootstrap(customConfig: UIManagerConfig, defaultConfig: UIManagerConfig): ApplicationInstance {
  setConfig(customConfig, defaultConfig);

  if (controlMode) {
    window.parent.postMessage({ type: PostMessageType.InnerReady }, '*');
    window.addEventListener('message', onMessage);
  }

  // 立即加载应用信息
  if (globalConfig.lazyLoadApplication === false) {
    loadApplication();
  }

  return instance;
}

function onMessage(event: any) {
  const messageType = event.data.type;
  if (messageType === PostMessageType.OuterSetConfig) {
    iframeDebuggerConfig = event.data.data;
    if (iframeDebuggerConfig.runtimeConfig) {
      setConfig(iframeDebuggerConfig.runtimeConfig as any);
    }
  } else if (messageType === PostMessageType.OuterSetApplication) {
    iframeApplicationLoadResolve(event.data.data);
  } else if (messageType === PostMessageType.OuterUpdateComponent) {
    const { metadataList, viewKey } = event.data.data;
    const activeView = activeViewMap.get(viewKey)
    activeView.update(metadataList);
    setTimeout(updateActiveRect);
  } else if (messageType === PostMessageType.OuterRefreshView) {
    window.location.reload();
  } else if (messageType === PostMessageType.OuterUpdateResource) {
    const { resourceList, resourceTaskList, resourceConfigList, viewKey } = event.data.data
    buildResource(resourceList, viewKey, resourceTaskList, resourceConfigList)
    const activeView = activeViewMap.get(viewKey)
    activeView.refresh()
  } else if (messageType === PostMessageType.OuterSetView) {
    const { viewKey } = event.data.data
    const activeView = activeViewMap.get(viewKey)
    activeView.initCallback(event.data.data)
  }


  else if (messageType === PostMessageType.OuterDragComponentOver) {
    respondDragOver(event.data.data.positionX, event.data.data.positionY);
  } else if (messageType === PostMessageType.OuterDragComponentEnter) {
    respondDragEnter();
  } else if (messageType === PostMessageType.OuterDragComponentLeave) {
    respondDragLeave();
  } else if (messageType === PostMessageType.OuterDragComponentDrop) {
    respondDragDrop(event.data.data.positionX, event.data.data.positionY, event.data.data.componentId, event.data.data.componentVersionId);
  } else if (messageType === PostMessageType.OuterOutlineReset) {
    resetWatch(event.data.data)
  } else if (messageType === PostMessageType.OuterComponentSelect) {
    outerSelected(event.data.data)
  }
}

function loadApplication(success = () => { }, fail = (e) => { throw e }) {
  if (globalConfig.beforeLoadApplication && typeof globalConfig.beforeLoadApplication === 'function') {
    const result = globalConfig.beforeLoadApplication() as Promise<any>

    if (result instanceof Promise) {
      instance.status = ApplicationStatus.BeforeLoading;
      instance.beforeLoadAppPromise = result;
      result.then(() => {
        instance.loadAppPromise = loadApplicationData().then(success, fail);
      });
    }
  } else {
    instance.loadAppPromise = loadApplicationData().then(success, fail);
  }
}

function loadApplicationData(): Promise<void> {
  if (instance.status === ApplicationStatus.Finish) {
    throw new Error('groot应用重复加载');
  }

  instance.status = ApplicationStatus.Loading;
  return fetchApplicationData().then((data) => {
    initApplication(data);
    instance.status = ApplicationStatus.Finish;
  });
}

function fetchApplicationData(): Promise<ApplicationData> {
  if (controlMode) {
    return new Promise((resolve, reject) => {
      iframeApplicationLoadResolve = resolve;
      window.parent.postMessage({ type: PostMessageType.InnerFetchApplication }, '*');
      setTimeout(() => {
        reject(new Error('load application timeout'))
      }, 3000);
    });
  } else if ((window as any)._grootApplicationData) {
    return Promise.resolve((window as any)._grootApplicationData);
  } else if (globalConfig.appDataUrl) {
    return window.fetch(globalConfig.appDataUrl).then(response => response.json());
  } else {
    const serverUrl = globalConfig.serverUrl || 'https://api.groot.com';
    const appDataUrl = `${serverUrl}/asset/application/${globalConfig.appKey}/${globalConfig.appEnv}`;
    return window.fetch(appDataUrl).then(response => response.json());
  }
}

function initApplication(data: ApplicationData) {
  // 初始化view
  data.viewList.forEach((viewData) => {
    const view = new View(viewData, controlMode && viewData.key === iframeDebuggerConfig.controlView);
    allViewMap.set(view.key, view);
  });
  buildResource(data.resourceList, null, data.resourceTaskList, data.resourceConfigList);
  if (controlMode) {
    window.parent.postMessage({ type: PostMessageType.InnerApplicationReady }, '*');
  }
}

function hasView(key: string) {
  return allViewMap.has(key);
}

function getView(key: string) {
  return allViewMap.get(key);
}

function viewLoading(key: string) {
  const view = allViewMap.get(key);
  const loadingResult = loadingViewMap.get(key)
  if (view && view.status === 'loading' && !loadingResult) {
    throw new Error('加载异常')
  }

  return loadingResult
}

function loadView(key: string): Promise<View> | View {
  const view = allViewMap.get(key);

  if (!view) {
    return Promise.reject(new Error('界面未找到'));
  } else if (view.status === 'finish') {
    activeViewMap.set(key, view)
    if (view.mainEntry) {
      activeMainEntryView = view
    }
    return view;
  }

  const result = view.init();
  loadingViewMap.set(key, result)
  result.finally(() => {
    loadingViewMap.delete(key)
    activeViewMap.set(key, view)
    if (view.mainEntry) {
      activeMainEntryView = view
    }
  })
  return result;
}

function unloadView(key: string) {
  const view = activeViewMap.get(key)
  view.destory()
  activeViewMap.delete(key)
  if (view.mainEntry) {
    activeMainEntryView = null
  }
}


