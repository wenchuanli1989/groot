import { commandBridge, getContext, grootManager } from "context";
import { WorkArea } from "./WorkArea";
import { ViewsContainer } from "@grootio/common";


export const shareBootstrap = () => {
  const { groot } = getContext();
  const { getState, registerState } = grootManager.state

  const workAreaViewContainer = {
    id: 'workArea',
    name: '工作区',
    view: () => {
      return <ViewsContainer context={workAreaViewContainer} groot={groot} />
    }
  }
  const workAreaView = {
    id: 'workArea',
    name: '工作区',
    view: <WorkArea />,
    parent: 'workArea'
  }

  registerState('gs.ui.stage.viewport', 'desktop', false)

  grootManager.command.registerCommand('gc.stageRefresh', (_, viewKey, data, callback) => {
    commandBridge.stageRefresh(viewKey, data, callback)
  })

  groot.onReady(() => {
    getState('gs.ui.viewContainerMap').set(workAreaViewContainer.id, workAreaViewContainer)
    getState('gs.ui.viewMap').set(workAreaView.id, workAreaView)
  })
}
