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

  getState('gs.ui.viewsContainers').push(...[
    {
      id: 'application',
      name: '页面',
      icon: () => {
        return <AppstoreOutlined />
      },
      view: function () {
        return <ViewsContainer context={this} groot={groot} />
      },
    }, {
      id: 'material',
      name: '物料',
      icon: () => {
        return <AppstoreOutlined />
      },
      view: function () {
        return <ViewsContainer context={this} groot={groot} />
      },
    }, {
      id: 'resource',
      name: '状态',
      icon: <AppstoreOutlined />,
      view: function () {
        return <ViewsContainer context={this} groot={groot} />
      }
    },
  ])

  getState('gs.ui.views').push(...[
    {
      id: 'application',
      name: '页面',
      view: <Application />,
      parent: 'application'
    }, {
      id: 'material',
      name: '物料',
      view: <Material />,
      parent: 'material'
    }, {
      id: 'resource',
      name: '状态',
      view: <ResourceList />,
      parent: 'resource'
    },

  ])


  registerState('gs.ui.activityBar.viewsContainers', ['application', 'material', 'resource'], true)
  registerState('gs.ui.activityBar.active', 'application', false);
  registerState('gs.ui.primarySidebar.active', 'application', false);

  groot.onReady(() => {
    executeCommand('gc.openEntry', +params.instanceId)
  })
}


