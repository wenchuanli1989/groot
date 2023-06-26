import { AppstoreOutlined } from "@ant-design/icons";
import { ViewsContainer } from "@grootio/common";
import { getContext, grootManager } from "context";
import { Solution } from "./Solution";


export const prototypeBootstrap = () => {
  const { groot, layout, params } = getContext();
  const { getState, setState } = grootManager.state
  const { executeCommand } = grootManager.command

  layout.primarySidebarWidth = '220px'

  groot.onReady(() => {
    initUI()

    if (+params.componentVersionId) {
      executeCommand('gc.openComponent', +params.componentVersionId)
    }
  })

  const initUI = () => {

    const solutionViewContainer = {
      id: 'solution',
      name: '组件',
      icon: () => {
        return <AppstoreOutlined />
      },
      view: () => {
        return <ViewsContainer context={solutionViewContainer} groot={groot} />
      },
    }

    getState('gs.ui.viewContainerMap').set(solutionViewContainer.id, solutionViewContainer)

    getState('gs.ui.viewMap').set('solution', {
      id: 'solution',
      name: '组件',
      view: <Solution />,
      parent: 'solution'
    })

    setState('gs.ui.activityBar.viewContainers', new Set(['solution']))
    setState('gs.ui.activityBar.active', 'solution');
    setState('gs.ui.primarySidebar.active', 'solution');
  }
}
