import { PostMessageType } from "@grootio/common";
import { getContext, grootManager } from "context";


export const prototypeBootstrap = () => {
  const { groot, } = getContext();
  const { registerCommand, executeCommand } = grootManager.command
  const { callHook } = grootManager.hook
  const { getState } = grootManager.state

  registerCommand('gc.pushMetadata', () => {
    const data = executeCommand('gc.createMetadata')
    callHook(PostMessageType.OuterUpdateComponent, {
      ...data,
      viewKey: getState('gs.stage.playgroundPath')
    })
  })

  groot.onReady(() => {
  })
}
