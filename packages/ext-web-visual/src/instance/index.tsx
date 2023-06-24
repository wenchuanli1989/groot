import { AppstoreOutlined } from "@ant-design/icons";
import { ViewsContainer } from "@grootio/common";
import { getContext, grootManager } from "context";
import { Application } from "./Application";
import { Material } from "./Material";
import ResourceList from "./Resource";



export const instanceBootstrap = () => {
  const { groot, params } = getContext();
  const { registerState, getState } = grootManager.state;
  const { executeCommand } = grootManager.command;

  const appViewContainer = {
    id: 'application',
    name: '页面',
    icon: () => {
      return <AppstoreOutlined />
    },
    view: () => {
      return <ViewsContainer context={appViewContainer} groot={groot} />
    },
  }

  const materialViewContainer = {
    id: 'material',
    name: '物料',
    icon: () => {
      return <AppstoreOutlined />
    },
    view: () => {
      return <ViewsContainer context={materialViewContainer} groot={groot} />
    },
  }

  const resourceViewContainer = {
    id: 'resource',
    name: '状态',
    icon: <AppstoreOutlined />,
    view: () => {
      return <ViewsContainer context={resourceViewContainer} groot={groot} />
    }
  }

  const viewContainerMap = getState('gs.ui.viewContainerMap')
  viewContainerMap.set(appViewContainer.id, appViewContainer)
  viewContainerMap.set(materialViewContainer.id, materialViewContainer)
  viewContainerMap.set(resourceViewContainer.id, resourceViewContainer)

  const viewMap = getState('gs.ui.viewMap')
  const appView = {
    id: 'application',
    name: '页面',
    view: <Application />,
    parent: 'application'
  }
  viewMap.set(appView.id, appView)

  const materialView = {
    id: 'material',
    name: '物料',
    view: <Material />,
    parent: 'material'
  }
  viewMap.set(materialView.id, materialView)

  const resourceView = {
    id: 'resource',
    name: '状态',
    view: <ResourceList />,
    parent: 'resource'
  }
  viewMap.set(resourceView.id, resourceView)


  registerState('gs.ui.activityBar.viewContainers', new Set(['application', 'material', 'resource']), false)
  registerState('gs.ui.activityBar.active', 'application', false);
  registerState('gs.ui.primarySidebar.active', 'application', false);

  groot.onReady(() => {
    executeCommand('gc.openEntry', +params.instanceId)
  })
}


