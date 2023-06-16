import { BaseModel, IframeDebuggerConfig, iframeNamePrefix, Metadata, PostMessageType, PropTask, Resource, ResourceConfig, ResourceTask, ViewData, ViewDataCore } from "@grootio/common";

import { commandBridge, getContext, grootManager, isPrototypeMode } from "context";

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
      PostMessageType.InnerUpdateDragAnchor,
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
    const { executeCommand } = grootManager.command

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

    registerHook(PostMessageType.OuterSetApplication, (data) => {
      guard();
      this.iframeEle.contentWindow.postMessage({ type: PostMessageType.OuterSetApplication, data }, '*');
    })

    registerHook(PostMessageType.InnerFetchView, (viewKey: string) => {
      guard();

      const viewData = this.viewDataMap.get(viewKey)
      callHook(PostMessageType.OuterSetView, viewData as any)

      if (this.pageNavCallback) {
        // 内部一般执行 组件刷新操作
        this.pageNavCallback();
        this.pageNavCallback = null;
      }
    })

    registerHook(PostMessageType.OuterUpdateResource, ({ resourceList, resourceTaskList, resourceConfigList, viewKey }) => {
      const viewData = this.viewDataMap.get(viewKey)
      viewData.resourceList = resourceList
      viewData.resourceTaskList = resourceTaskList
      viewData.resourceConfigList = resourceConfigList

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

    registerHook(PostMessageType.OuterRefreshView, (path) => {
      guard()
      this.iframeEle.contentWindow.postMessage({
        type: PostMessageType.OuterRefreshView,
        data: path
      }, '*');
    })

    registerHook(PostMessageType.OuterDragComponentEnter, () => {
      guard()
      this.iframeEle.contentWindow.postMessage({
        type: PostMessageType.OuterDragComponentEnter,
      }, '*');
    })

    registerHook(PostMessageType.OuterDragComponentOver, (data) => {
      guard()
      this.iframeEle.contentWindow.postMessage({
        type: PostMessageType.OuterDragComponentOver,
        data
      }, '*');
    })

    registerHook(PostMessageType.OuterDragComponentLeave, () => {
      guard()
      this.iframeEle.contentWindow.postMessage({
        type: PostMessageType.OuterDragComponentLeave,
      }, '*');
    })

    registerHook(PostMessageType.OuterDragComponentDrop, (data) => {
      guard()
      this.iframeEle.contentWindow.postMessage({
        type: PostMessageType.OuterDragComponentDrop,
        data
      }, '*');
    })

    registerHook(PostMessageType.OuterComponentSelect, (data) => {
      guard()
      this.iframeEle.contentWindow.postMessage({
        type: PostMessageType.OuterComponentSelect,
        data
      }, '*');
    })

    registerHook(PostMessageType.OuterSetView, (data) => {
      guard()
      this.iframeEle.contentWindow.postMessage({
        type: PostMessageType.OuterSetView,
        data
      }, '*');
    })

  }

  private refresh = (viewKey: string, data: ViewDataCore, callback?: Function) => {
    this.viewDataMap.set(viewKey, data)
    this.pageNavCallback = callback;

    const iframeBasePath = grootManager.state.getState('gs.stage.debugBaseUrl')

    const path = `${iframeBasePath}${viewKey}`;
    if (this.iframeEle.src) {
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