import { PostMessageType } from "@grootio/common";
import { getContext, grootManager } from "context";



export const instanceBootstrap = () => {
  const { groot } = getContext();
  const { registerCommand, executeCommand } = grootManager.command
  const { callHook } = grootManager.hook

  registerCommand('gc.selectInstance', (_, instanceId) => {
    selectInstance(instanceId)
  })

  groot.onReady(() => {
  })

  const selectInstance = (instanceId: number) => {
    const { root } = grootManager.state.getState('gs.view')
    if (instanceId === root.id) {
      // 根组件不需要选择效果，直接切换，并清空标记
      executeCommand('gc.switchIstance', root.id)
      callHook(PostMessageType.OuterOutlineReset)
    } else {
      callHook(PostMessageType.OuterComponentSelect, instanceId)
    }
  }
}

