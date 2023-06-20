import { ComponentInstance, PostMessageType, } from "@grootio/common";
import { getContext, grootManager } from "context";


export const instanceBootstrap = () => {
  const { groot } = getContext();
  const { registerState, watchState, getState } = grootManager.state;
  const { registerCommand, executeCommand } = grootManager.command;
  const { callHook } = grootManager.hook;

  registerState('gs.propSetting.breadcrumbList', [], true)

  registerCommand('gc.pushMetadata', (_, instanceId) => {
    const entryId = grootManager.state.getState('gs.entry').id
    const data = executeCommand('gc.createMetadata', entryId)
    const entry = getState('gs.entryList').find(item => item.id === entryId)
    callHook(PostMessageType.OuterUpdateComponent, {
      ...data,
      viewKey: entry.key,
    })
  })

  registerCommand('gc.pushResource', (_, entryId) => {
    const data = executeCommand('gc.createResource', entryId)
    let viewKey;

    if (entryId) {
      const entry = getState('gs.entryList').find(item => item.id === entryId)
      viewKey = entry.key
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
  const list = getState('gs.allComponentInstance')
  const breadcrumbList = grootManager.state.getState('gs.propSetting.breadcrumbList')
  breadcrumbList.length = 0;

  let ctxInstance = newInstance;
  do {
    breadcrumbList.push({ id: ctxInstance.id, name: ctxInstance.name });
    ctxInstance = list.find((item) => item.id === ctxInstance.parentId);
  } while (ctxInstance);
  breadcrumbList.reverse();
}