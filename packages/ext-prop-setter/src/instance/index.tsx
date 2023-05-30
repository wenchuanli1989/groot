import { ComponentInstance, PostMessageType, } from "@grootio/common";
import { getContext, grootManager } from "context";


export const instanceBootstrap = () => {
  const { groot } = getContext();
  const { registerState, watchState } = grootManager.state;
  const { registerCommand, executeCommand } = grootManager.command;
  const { callHook } = grootManager.hook;



  registerState('gs.propSetting.breadcrumbList', [], true)


  registerCommand('gc.pushMetadata', (_, type) => {
    if (type === 'all') {
      const data = executeCommand('gc.createMetadata')
      callHook(PostMessageType.OuterUpdateComponent, data)
    } else {
    }
  })

  registerCommand('gc.pushResource', (_, type) => {
    if (type === 'all') {
      const data = executeCommand('gc.createResource', true)

      callHook(PostMessageType.OuterUpdateResource, data)
    }
  })

  groot.onReady(() => {
    watchState('gs.componentInstance', updateBreadcrumbList)
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