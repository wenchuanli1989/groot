import { AppstoreOutlined } from "@ant-design/icons";
import { ViewsContainer } from "@grootio/common";
import { getContext, grootManager } from "context";
import { Solution } from "./Solution";


export const prototypeBootstrap = () => {
  const { groot, layout, params } = getContext();
  const { registerState, getState } = grootManager.state
  const { executeCommand } = grootManager.command

  getState('gs.ui.viewsContainers').push(...[
    {
      id: 'solution',
      name: '组件',
      icon: () => {
        return <AppstoreOutlined />
      },
      view: function () {
        return <ViewsContainer context={this} groot={groot} />
      },
    }
  ])

  getState('gs.ui.views').push(...[
    {
      id: 'solution',
      name: '组件',
      view: <Solution />,
      parent: 'solution'
    },
  ])


  registerState('gs.ui.activityBar.viewsContainers', ['solution'], true)
  registerState('gs.ui.activityBar.active', 'solution', false);
  registerState('gs.ui.primarySidebar.active', 'solution', false);

  layout.primarySidebarWidth = '220px'

  groot.onReady(() => {
    executeCommand('gc.loadComponent', +params.componentVersionId).then(({ component, propTaskList, metadataList }) => {
      const viewKey = getState('gs.stage.playgroundPath')
      executeCommand('gc.stageRefresh', viewKey, {
        resourceList: [], resourceConfigList: [], resourceTaskList: [],
        propTaskList, metadataList,
      })
      grootManager.state.setState('gs.component', component)
    })
  })
}
