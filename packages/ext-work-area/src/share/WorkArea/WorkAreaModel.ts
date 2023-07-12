import { BaseModel, IframeDebuggerConfig, iframeNamePrefix, PostMessageType, ViewDataCore } from "@grootio/common";

import { commandBridge, getContext, grootManager } from "context";

export default class WorkAreaModel extends BaseModel {
  static modelName = 'workArea';

  public iframeEle: HTMLIFrameElement;
  private iframeReady = false
  private iframeDebuggerConfig: IframeDebuggerConfig = {
    runtimeConfig: {}
  }
  private pageNavCallback: Function;
  private viewDataMap = new Map<string, ViewDataCore>()

  public initIframe(iframe: HTMLIFrameElement) {
    const { mode } = getContext().params

    this.iframeEle = iframe;
    this.iframeEle.contentWindow.name = `${iframeNamePrefix}${mode}`;

    // 传递基本信息
    window.self.addEventListener('message', this.onMessage);
    this.initListener()

    commandBridge.stageRefresh = this.refresh;
  }


  private onMessage = (event: MessageEvent) => {
    if (!event.data) {
      throw new Error('iframe通讯数据无效');
    }

    const { callHook } = grootManager.hook

    const eventTypeList = [
      PostMessageType.InnerReady,
      PostMessageType.InnerFetchApplication,
      PostMessageType.InnerApplicationReady,
      PostMessageType.InnerFetchView,
      PostMessageType.InnerDragHitSlot,
      PostMessageType.InnerDragRefreshCursor,
      PostMessageType.InnerOutlineHover,
      PostMessageType.InnerOutlineSelect,
      PostMessageType.InnerOutlineUpdate
    ]

    if (eventTypeList.includes(event.data.type)) {
      callHook(event.data.type, event.data.data)
    } else {
      console.warn(`未知的iframe消息: ${event.data}`)
    }

  }

  public initListener = () => {

    const guard = () => {
      if (!this.iframeReady) {
        throw new Error('iframe not ready!!!');
      }
    }

    const { registerHook, callHook } = grootManager.hook

    registerHook(PostMessageType.InnerReady, () => {
      this.iframeReady = true;
      // 提供hook调用方式方便第三方监控或日志
      callHook(PostMessageType.OuterSetConfig)
    })

    registerHook(PostMessageType.OuterSetConfig, (config) => {
      guard();
      const messageData = config || this.iframeDebuggerConfig
      this.iframeEle.contentWindow.postMessage({ type: PostMessageType.OuterSetConfig, data: messageData }, '*');
    })

    registerHook(PostMessageType.InnerFetchView, (viewKey: string) => {
      guard();

      const viewData = this.viewDataMap.get(viewKey)
      const data = {
        viewKey,
        ...viewData
      }
      callHook(PostMessageType.OuterSetView, data)

      if (this.pageNavCallback) {
        // 内部一般执行 组件刷新操作
        this.pageNavCallback();
        this.pageNavCallback = null;
      }
    })

    registerHook(PostMessageType.OuterUpdateResource, ({ resourceList, resourceTaskList, resourceConfigList, viewKey }) => {

      const viewData = this.viewDataMap.get(viewKey)
      if (viewData) {
        viewData.resourceList = resourceList
        viewData.resourceTaskList = resourceTaskList
        viewData.resourceConfigList = resourceConfigList
      }

      if (this.iframeReady) {
        this.iframeEle.contentWindow.postMessage({
          type: PostMessageType.OuterUpdateResource,
          data: {
            viewKey,
            resourceList,
            resourceTaskList,
            resourceConfigList
          }
        }, '*');
      }
    })

    registerHook(PostMessageType.OuterUpdateComponent, ({ metadataList, propTaskList, viewKey }) => {
      const viewData = this.viewDataMap.get(viewKey)
      viewData.metadataList = metadataList
      viewData.propTaskList = propTaskList

      if (this.iframeReady) {
        this.iframeEle.contentWindow.postMessage({
          type: PostMessageType.OuterUpdateComponent,
          data: {
            viewKey,
            metadataList,
            propTaskList
          }
        }, '*');
      }
    })

    this.registerHooks([
      PostMessageType.OuterSetView,
      PostMessageType.OuterComponentSelect,
      PostMessageType.OuterDragAddComponentDrop,
      PostMessageType.OuterDragAddComponentLeave,
      PostMessageType.OuterDragAddComponentOver,
      PostMessageType.OuterDragAddComponentEnter,
      PostMessageType.OuterRefreshView,
      PostMessageType.OuterSetApplication
    ], guard)
  }

  private registerHooks(hookNameList: any[], guard: Function) {
    for (const hookName of hookNameList) {
      grootManager.hook.registerHook(hookName, (data) => {
        guard()
        this.iframeEle.contentWindow.postMessage({
          type: hookName,
          data
        }, '*');
      })
    }
  }

  private refresh = (viewKey: string, data: ViewDataCore, callback?: Function) => {
    this.viewDataMap.set(viewKey, data)
    this.pageNavCallback = callback;

    const iframeBasePath = grootManager.state.getState('gs.stage.debugBaseUrl')

    const path = `${iframeBasePath}${viewKey}`;
    if (this.iframeEle.src) {
      grootManager.hook.callHook(PostMessageType.OuterOutlineReset)
      if (this.iframeEle.src === path) {
        grootManager.hook.callHook(PostMessageType.OuterRefreshView, path)
      } else {
        this.iframeDebuggerConfig.controlView = viewKey;
        this.iframeEle.src = path;
      }
    } else {
      this.iframeDebuggerConfig.controlView = viewKey;
      this.iframeEle.src = path;
    }
  }


}