import { AppstoreOutlined } from "@ant-design/icons";
import { ViewsContainer } from "@grootio/common";
import { getContext, grootManager } from "context";
import { Application } from "./Application";
import { Material } from "./Material";
import Resource from "./Resource";



export const instanceBootstrap = () => {
  const { groot, params } = getContext();
  const { getState, setState } = grootManager.state;
  const { executeCommand } = grootManager.command;


  groot.onReady(() => {
    initUI()
    if (+params.viewId) {
      executeCommand('gc.openView', +params.viewId)
    }
  })

  const initUI = () => {
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



    const appView = {
      id: 'application',
      name: '页面',
      view: <Application />,
      parent: 'application'
    }

    const materialView = {
      id: 'material',
      name: '物料',
      view: <Material />,
      parent: 'material'
    }

    const resourceView = {
      id: 'resource',
      name: '状态',
      view: <Resource />,
      parent: 'resource'
    }

    const viewContainerMap = getState('gs.ui.viewContainerMap')
    viewContainerMap.set(appViewContainer.id, appViewContainer)
    viewContainerMap.set(materialViewContainer.id, materialViewContainer)
    viewContainerMap.set(resourceViewContainer.id, resourceViewContainer)

    const viewMap = getState('gs.ui.viewMap')
    viewMap.set(appView.id, appView)
    viewMap.set(materialView.id, materialView)
    viewMap.set(resourceView.id, resourceView)

    setState('gs.ui.activityBar.viewContainers', new Set(['application', 'material', 'resource']))
    setState('gs.ui.activityBar.active', 'application');
    setState('gs.ui.primarySidebar.active', 'application');
  }
}


