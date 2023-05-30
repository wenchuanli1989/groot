import { AppstoreOutlined } from "@ant-design/icons";
import { APIPath, ExtensionLevel, ExtensionRuntime, PostMessageType, Resource, ViewsContainer } from "@grootio/common";
import { getContext, grootManager } from "context";
import { Application } from "./Application";
import { Material } from "./Material";
import ResourceList from "./Resource";



export const instanceBootstrap = () => {
  const { groot, params } = getContext();
  const { registerState, getState } = grootManager.state;
  const { registerCommand, executeCommand } = grootManager.command;

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


  registerState('gs.componentInstance', null, false)
  registerState('gs.component', null, false)
  registerState('gs.allComponentInstance', [], true)
  registerState('gs.release', null, false)
  registerState('gs.globalResourceList', params.application.resourceList as Resource[], true)
  registerState('gs.globalResourceConfigList', params.application.resourceConfigList, true)
  registerState('gs.localResourceList', [], true)
  registerState('gs.localResourceConfigList', [], true)

  registerCommand('gc.fetch.instance', (_, rootInstanceId) => {
    fetchRootInstance(rootInstanceId);
  });

  registerCommand('gc.switchIstance', (_, instanceId) => {
    switchComponentInstance(instanceId)
  })

  groot.onReady(() => {
    executeCommand('gc.fetch.instance', params.instanceId)
  })
}


const fetchRootInstance = (rootInstanceId: number) => {
  const { request, groot: { loadExtension, launchExtension, extHandler }, params, layout } = getContext();
  request(APIPath.componentInstance_rootDetail_instanceId, { instanceId: rootInstanceId }).then(({ data: { children, root, release, solutionInstanceList, entryExtensionInstanceList, resourceList, resourceConfigList } }) => {

    // 卸载
    [...extHandler.entry.values()].forEach(ext => {
      extHandler.uninstall(ext.id, ExtensionLevel.Entry)
    })

    Array.from(extHandler.solution.entries()).forEach(([solutionId, solution]) => {
      [...solution.values()].forEach(ext => {
        extHandler.uninstall(ext.id, ExtensionLevel.Solution, solutionId)
      })
    })

    const list = [root, ...children]

    const solutionPromiseList = solutionInstanceList.map(solutionInstance => {
      return loadExtension(solutionInstance.extensionInstanceList as ExtensionRuntime[], ExtensionLevel.Solution, solutionInstance.id)
    })

    const entryPromise = loadExtension(entryExtensionInstanceList as ExtensionRuntime[], ExtensionLevel.Entry)

    Promise.all([...solutionPromiseList, entryPromise]).then(() => {

      for (const solutionInstance of solutionInstanceList) {
        launchExtension(solutionInstance.extensionInstanceList as ExtensionRuntime[], {
          mode: params.mode,
          application: params.application,
          solution: null,
          account: params.account,
          instanceId: params.instanceId,
          componentId: params.componentId,
          versionId: params.versionId
        }, layout, ExtensionLevel.Solution)
      }

      launchExtension(entryExtensionInstanceList as ExtensionRuntime[], {
        mode: params.mode,
        application: params.application,
        solution: null,
        account: params.account,
        instanceId: params.instanceId,
        componentId: params.componentId,
        versionId: params.versionId
      }, layout, ExtensionLevel.Entry)
    })

    // for (const { itemList, blockList } of list) {
    //   itemList.forEach(item => {
    //     parseOptions(item);
    //   })

    //   blockList.filter(block => block.struct === PropBlockStructType.List).forEach((block) => {
    //     block.listStructData = JSON.parse(block.listStructData as any || '[]');
    //   })
    // }

    const application = getContext().params.application
    const { setState } = grootManager.state
    const { executeCommand } = grootManager.command
    const { callHook } = grootManager.hook

    setState('gs.stage.debugBaseUrl', release.debugBaseUrl || application.debugBaseUrl)
    setState('gs.stage.playgroundPath', release.playgroundPath || application.playgroundPath)
    setState('gs.release', release)
    setState('gs.allComponentInstance', list)
    setState('gs.localResourceList', resourceList as Resource[])
    setState('gs.localResourceConfigList', resourceConfigList)

    const resourceData = executeCommand('gc.createResource', true)
    const metadataData = executeCommand('gc.createMetadata')
    callHook(PostMessageType.SwitchView, { ...resourceData, ...metadataData })
    switchComponentInstance(root.id);
  });
}

export const switchComponentInstance = (instanceId: number) => {
  const list = grootManager.state.getState('gs.allComponentInstance');
  const instance = list.find(item => item.id === instanceId);
  grootManager.state.setState('gs.componentInstance', instance);
  grootManager.state.setState('gs.component', instance.component);
}
