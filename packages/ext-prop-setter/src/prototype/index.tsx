import { PostMessageType } from "@grootio/common";
import { getContext, grootManager } from "context";


export const prototypeBootstrap = () => {
  const { groot, } = getContext();
  const { registerCommand, executeCommand } = grootManager.command
  const { callHook } = grootManager.hook


  registerCommand('gc.pushMetadata', (_, type) => {
    if (type === 'all') {
      const data = executeCommand('gc.createMetadata')
      callHook(PostMessageType.OuterUpdateComponent, data)
    } else {
    }
  })

  groot.onReady(() => {
  })
}
