import { ComponentInstance, PostMessageType, } from "@grootio/common";
import { getContext, grootManager } from "context";


export const instanceBootstrap = () => {
  const { groot } = getContext();
  const { registerState, watchState, getState } = grootManager.state;
  const { registerCommand, executeCommand } = grootManager.command;
  const { callHook } = grootManager.hook;

  registerState('gs.propSetting.breadcrumbList', [], true)

  registerCommand('gc.pushMetadata', (_, instanceId) => {
    const viewId = grootManager.state.getState('gs.view').viewId
    const data = executeCommand('gc.createMetadata', viewId)
    const view = getState('gs.viewList').find(item => item.id === viewId)
    callHook(PostMessageType.OuterUpdateComponent, {
      ...data,
      viewKey: view.key,
    })
  })

  registerCommand('gc.pushResource', (_, viewId) => {
    const data = executeCommand('gc.createResource', viewId)
    let viewKey;

    if (viewId) {
      const view = getState('gs.viewList').find(item => item.id === viewId)
      viewKey = view.key
    }
    callHook(PostMessageType.OuterUpdateResource, {
      ...data,
      viewKey
    })
  })

  groot.onReady(() => {
    watchState('gs.activeComponentInstance', updateBreadcrumbList)
  })
}


const updateBreadcrumbList = (newInstance: ComponentInstance) => {
  const { getState } = grootManager.state
  const { root, children } = getState('gs.view')
  const list = [root, ...children]
  const breadcrumbList = grootManager.state.getState('gs.propSetting.breadcrumbList')
  breadcrumbList.length = 0;

  let ctxInstance = newInstance;
  do {
    breadcrumbList.push({ id: ctxInstance.id, name: ctxInstance.component.name });
    ctxInstance = list.find((item) => item.id === ctxInstance.parentId);
  } while (ctxInstance);
  breadcrumbList.reverse();
}