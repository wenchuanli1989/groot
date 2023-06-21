import { grootManager } from "context"

export const shareBootstrap = () => {
  const { registerState } = grootManager.state

  registerState('gs.stage.debugBaseUrl', null, false)
  registerState('gs.stage.playgroundPath', null, false)
  registerState('gs.component', null, false)
  registerState('gs.propTree', [], true)
  registerState('gs.activePropGroupId', null, false)
}