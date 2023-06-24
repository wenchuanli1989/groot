import { commandBridge, getContext, grootManager } from "context";
import { WorkArea } from "./WorkArea";
import { ViewsContainer } from "@grootio/common";


export const shareBootstrap = () => {
  const { groot } = getContext();
  const { registerState } = grootManager.state

  const workAreaViewContainer = {
    id: 'workArea',
    name: '工作区',
    view: () => {
      return <ViewsContainer context={workAreaViewContainer} groot={groot} />
    }
  }
  registerState('gs.ui.viewContainerMap', new Map([
    [workAreaViewContainer.id, workAreaViewContainer]
  ]), false)

  registerState('gs.ui.viewMap', new Map([
    ['workArea', {
      id: 'workArea',
      name: '工作区',
      view: <WorkArea />,
      parent: 'workArea'
    }]
  ]), false)

  registerState('gs.ui.stage.viewport', 'desktop', false)


  grootManager.command.registerCommand('gc.stageRefresh', (_, viewKey, data, callback) => {
    commandBridge.stageRefresh(viewKey, data, callback)
  })
}
