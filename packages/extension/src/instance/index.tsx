import { AppstoreOutlined } from "@ant-design/icons";
import { APIPath, ComponentInstance, ExtensionLevel, ExtensionRuntime, PropBlockStructType, PropGroup, State, StateCategory } from "@grootio/common";
import { metadataFactory, propItemPipeline, propTreeFactory } from "@grootio/core";
import { getContext, grootManager } from "context";
import ViewsContainer from "core/ViewsContainer";
import { parseOptions, uuid } from "util/utils";
import { Application } from "./Application";
import { Material } from "./Material";
import StateList from "./State";



export const instanceBootstrap = () => {
  const { groot, params } = getContext();
  const { registerState, getState } = grootManager.state;
  const { registerCommand, executeCommand } = grootManager.command;
  const { callHook } = grootManager.hook;

  getState('gs.ui.viewsContainers').push(...[
    {
      id: 'application',
      name: '页面',
      icon: () => {
        return <AppstoreOutlined />
      },
      view: function () {
        return <ViewsContainer context={this} />
      },
    }, {
      id: 'material',
      name: '物料',
      icon: () => {
        return <AppstoreOutlined />
      },
      view: function () {
        return <ViewsContainer context={this} />
      },
    }, {
      id: 'state',
      name: '状态',
      icon: <AppstoreOutlined />,
      view: function () {
        return <ViewsContainer context={this} />
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
  registerState('gs.propSetting.breadcrumbList', [], true)
  registerState('gs.release', null, false)
  registerState('gs.globalStateList', [], true)
  registerState('gs.localStateList', [], true)

  registerCommand('gc.fetch.instance', (_, rootInstanceId) => {
    fetchRootInstance(rootInstanceId);
  });

  registerCommand('gc.switchIstance', (_, instanceId) => {
    switchComponentInstance(instanceId)
  })

  registerCommand('gc.makeDataToStage', (_, refreshId) => {
    const list = getState('gs.allComponentInstance')
    if (refreshId === 'all' || refreshId === 'first') {
      const metadataList = instanceToMetadata(list);
      callHook('gh.component.propChange', metadataList, refreshId === 'first')
      return;
    }

    let instanceId = refreshId;
    if (refreshId === 'current') {
      instanceId = getState('gs.componentInstance').id;
    }

    const refreshInstance = list.find(i => i.id === instanceId);
    const [refreshMetadata] = instanceToMetadata([refreshInstance]);
    callHook('gh.component.propChange', refreshMetadata)
  })

  groot.onReady(() => {
    executeCommand('gc.fetch.instance', params.instanceId)
  })
}


const instanceToMetadata = (instanceList: ComponentInstance[]) => {
  const { groot: { extHandler } } = getContext();
  return instanceList.map((instance) => {
    const { groupList, blockList, itemList } = instance;
    const valueList = instance.valueList;
    if (!instance.propTree) {

      itemList.forEach(item => {
        parseOptions(item);
        delete item.valueOptions
      })

      blockList.filter(block => block.struct === PropBlockStructType.List).forEach((block) => {
        block.listStructData = JSON.parse(block.listStructData as any || '[]');
      })

      instance.propTree = propTreeFactory(groupList, blockList, itemList, valueList) as PropGroup[];
      groupList.forEach((group) => {
        if (!Array.isArray(group.expandBlockIdList)) {
          group.expandBlockIdList = group.propBlockList.map(block => block.id);
        }
      })
    }

    const entryPropItemPipelineModuleList = [...extHandler.entry.values()].filter(ext => !!ext.propItemPipeline).map(ext => ext.propItemPipeline)
    const releasePropItemPipelineModuleList = [...extHandler.application.values()].filter(ext => !!ext.propItemPipeline).map(ext => ext.propItemPipeline)
    const solutionPropItemPipelineModuleList = [...(extHandler.solution.get(instance.solutionInstanceId).values() || [])].filter(ext => !!ext.propItemPipeline).map(ext => ext.propItemPipeline)

    const metadata = metadataFactory(instance.propTree, {
      packageName: instance.component.packageName,
      componentName: instance.component.componentName,
      metadataId: instance.id,
      rootMetadataId: instance.rootId,
      parentMetadataId: instance.parentId,
    }, (params) => {
      propItemPipeline(entryPropItemPipelineModuleList, releasePropItemPipelineModuleList, solutionPropItemPipelineModuleList, params)
    }, true);
    return metadata;
  })
}

const fetchRootInstance = (rootInstanceId: number) => {
  const { request, groot: { loadExtension, launchExtension }, params, layout } = getContext();
  request(APIPath.componentInstance_rootDetail_instanceId, { instanceId: rootInstanceId }).then(({ data: { children, root, release, solutionInstanceList, entryExtensionInstanceList } }) => {

    const list = [root, ...children]

    const solutionPromiseList = solutionInstanceList.map(solutionInstance => {
      return loadExtension(solutionInstance.extensionInstanceList as ExtensionRuntime[], ExtensionLevel.Solution, solutionInstance.solutionVersionId)
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

  const breadcrumbList = grootManager.state.getState('gs.propSetting.breadcrumbList')
  breadcrumbList.length = 0;

  let ctxInstance = instance;
  do {
    breadcrumbList.push({ id: ctxInstance.id, name: ctxInstance.name });
    ctxInstance = list.find((item) => item.id === ctxInstance.parentId);
  } while (ctxInstance);
  breadcrumbList.reverse();
}
