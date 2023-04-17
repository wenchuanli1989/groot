import { AppstoreOutlined } from "@ant-design/icons";
import { APIPath, ExtensionLevel, ExtensionRuntime, State, StateCategory, ViewsContainer } from "@grootio/common";
import { getContext, grootManager } from "context";
import { uuid } from "util/utils";
import { Application } from "./Application";
import { Material } from "./Material";
import StateList from "./State";



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
      id: 'state',
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
      id: 'state',
      name: '状态',
      view: <StateList />,
      parent: 'state'
    },

  ])


  registerState('gs.ui.activityBar.viewsContainers', ['application', 'material', 'state'], true)
  registerState('gs.ui.activityBar.active', 'application', false);
  registerState('gs.ui.primarySidebar.active', 'application', false);


  registerState('gs.componentInstance', null, false)
  registerState('gs.component', null, false)
  registerState('gs.allComponentInstance', [], true)
  registerState('gs.release', null, false)
  registerState('gs.globalStateList', [], true)
  registerState('gs.localStateList', [], true)

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
  request(APIPath.componentInstance_rootDetail_instanceId, { instanceId: rootInstanceId }).then(({ data: { children, root, release, solutionInstanceList, entryExtensionInstanceList } }) => {

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
    grootManager.state.setState('gs.stage.debugBaseUrl', release.debugBaseUrl || application.debugBaseUrl)
    grootManager.state.setState('gs.stage.playgroundPath', release.playgroundPath || application.playgroundPath)
    grootManager.state.setState('gs.release', release)
    grootManager.state.setState('gs.allComponentInstance', list)

    const globalStateList = root.stateList.filter(item => !item.instanceId)
    const localStateList = root.stateList.filter(item => !!item.instanceId)

    const runtimeStateList: Partial<State>[] = []

    runtimeStateList.push({
      id: uuid(),
      name: '标题',
      value: 'xxx',
      type: StateCategory.Str,
      isReadonly: true,
      instanceId: root.id
    })

    grootManager.state.setState('gs.localStateList', [...(runtimeStateList as any), ...localStateList])
    grootManager.state.setState('gs.globalStateList', globalStateList)

    grootManager.command.executeCommand('gc.makeDataToStage', 'first');
    switchComponentInstance(root.id);
  });
}

export const switchComponentInstance = (instanceId: number) => {
  const list = grootManager.state.getState('gs.allComponentInstance');
  const instance = list.find(item => item.id === instanceId);
  grootManager.state.setState('gs.componentInstance', instance);
  grootManager.state.setState('gs.component', instance.component);
}
