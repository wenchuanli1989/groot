import { AppstoreOutlined } from "@ant-design/icons";
import { APIPath, PostMessageType, PropBlockStructType, ViewsContainer } from "@grootio/common";
import { getContext, grootManager } from "context";
import { parseOptions } from "util/index";
import { Solution } from "./Solution";


export const prototypeBootstrap = () => {
  const { groot, layout, params } = getContext();
  const { registerState, getState, setState } = grootManager.state
  const { registerCommand, executeCommand } = grootManager.command

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
  registerState('gs.component', null, false)

  registerCommand('gc.fetch.prototype', (_, componentId, versionId) => {
    fetchComponent(componentId, versionId);
  })


  layout.primarySidebarWidth = '220px'

  groot.onReady(() => {
    setState('gs.stage.debugBaseUrl', params.solution.solutionVersion.debugBaseUrl)
    setState('gs.stage.playgroundPath', params.solution.solutionVersion.playgroundPath)
    executeCommand('gc.fetch.prototype', params.componentId, params.versionId)
  })
}

const fetchComponent = (componentId: number, versionId) => {
  const { request } = getContext();
  request(APIPath.componentPrototype_detail_componentId, { componentId, versionId }).then(({ data }) => {
    const { blockList, itemList } = data;
    blockList.filter(block => block.struct === PropBlockStructType.List).forEach((block) => {
      block.listStructData = JSON.parse(block.listStructData as any || '[]');
    })

    itemList.forEach(item => {
      parseOptions(item);
    })

    grootManager.state.setState('gs.component', data)

    const metadataData = grootManager.command.executeCommand('gc.createMetadata')
    grootManager.command.executeCommand('gc.stageRefresh', { ...metadataData, resourceList: [], resourceConfigList: [], resourceTaskList: [] }, null)
  })
}
