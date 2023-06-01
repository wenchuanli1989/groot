import { commandBridge, getContext, grootManager } from "context";
import { WorkArea } from "./WorkArea";
import { ViewsContainer } from "@grootio/common";


export const shareBootstrap = () => {
  const { groot } = getContext();
  const { registerState } = grootManager.state

  registerState('gs.ui.viewsContainers', [
    {
      id: 'workArea',
      name: '工作区',
      view: function () {
        return <ViewsContainer context={this} groot={groot} />
      }
    }
  ], true)

  registerState('gs.ui.views', [
    {
      id: 'workArea',
      name: '工作区',
      view: <WorkArea />,
      parent: 'workArea'
    }
  ], true)

  registerState('gs.ui.stageViewport', 'desktop', false)

  registerState('gs.stage.debugBaseUrl', '', false)
  registerState('gs.stage.playgroundPath', '', false)

  grootManager.command.registerCommand('gc.stageRefresh', (_, data, callback) => {
    commandBridge.stageRefresh(data, callback)
  })
}
