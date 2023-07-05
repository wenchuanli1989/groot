import { APIPath, ComponentInstance, ExtensionInstance, ExtensionLevel, PropBlockStructType, PropGroup, PropItemPipelineParams, Resource, ResourceConfig, SolutionInstance, propAppendTask } from "@grootio/common"
import { metadataFactory, pipelineExec, propTreeFactory } from '@grootio/core'
import { getContext, grootManager } from "context"
import { parseOptions } from "../util"
import { createResourceTaskList } from "util/resource"

const viewCache = new Map<number, {
  root: ComponentInstance,
  children: ComponentInstance[],
  solutionInstanceList: SolutionInstance[],
  viewExtensionInstanceList: ExtensionInstance[],
  resourceList: Resource[],
  resourceConfigList: ResourceConfig[]
}>()
const activeViewIdSet = new Set<number>()
let selectViewId: number

export const instanceBootstrap = () => {

  const { registerCommand } = grootManager.command
  const { registerState } = grootManager.state

  registerState('gs.release', null, false)
  registerState('gs.app', null, false)
  registerState('gs.viewList', null, true)
  registerState('gs.globalResourceList', null, true)
  registerState('gs.globalResourceConfigList', null, true)
  registerState('gs.activeComponentInstance', null, false)
  registerState('gs.localResourceList', null, true)
  registerState('gs.localResourceConfigList', null, true)
  registerState('gs.view', null, false)


  registerCommand('gc.createMetadata', (_, viewId) => {
    return createFullMetadata(viewId)
  })

  registerCommand('gc.createResource', (_, viewId) => {
    return createResource(viewId)
  })

  registerCommand('gc.loadView', (_, viewId) => {
    return loadView(viewId);
  })

  registerCommand('gc.openView', (_, viewId, primaryView) => {
    return openView(viewId, primaryView)
  })

  registerCommand('gc.unloadView', (_, viewId) => {
    unloadView(viewId)
  })

  registerCommand('gc.switchIstance', (_, instanceId, viewId) => {
    switchComponentInstance(instanceId, viewId)
  })

  getContext().groot.onReady(onReady)

}

const onReady = () => {
  const { groot: { loadExtension, launchExtension } } = getContext()
  const { setState } = grootManager.state
  const releaseId = +getContext().params.releaseId || null

  getContext().request(APIPath.application_detailByReleaseId, { releaseId }).then(({ data: { release, viewList, resourceList, resourceConfigList, extensionInstanceList, ...app } }) => {
    setState('gs.release', release)
    setState('gs.app', app as any)
    setState('gs.stage.debugBaseUrl', release.debugBaseUrl || app.debugBaseUrl)
    setState('gs.stage.playgroundPath', release.playgroundPath || app.playgroundPath)
    setState('gs.viewList', viewList)
    setState('gs.globalResourceList', resourceList)
    setState('gs.globalResourceConfigList', resourceConfigList)

    // 加载应用级别扩展插件
    const remoteExtensionList = extensionInstanceList
    loadExtension({ remoteExtensionList, extLevel: ExtensionLevel.Application }).then(() => {

      launchExtension(remoteExtensionList, ExtensionLevel.Application)

      grootManager.hook.callHook('gh.allReady')
      getContext().layout.refresh()
    })

  })
}

const createResource = (viewId: number) => {
  if (viewId) {
    if (!viewCache.has(viewId)) throw new Error('未知viewId')

    const { resourceList, resourceConfigList } = viewCache.get(viewId)
    const resourceTaskList = createResourceTaskList(resourceList, viewId)

    return {
      resourceConfigList,
      resourceList,
      resourceTaskList
    }
  } else {
    const resourceList = grootManager.state.getState('gs.globalResourceList')['__groot_origin']
    const resourceConfigList = grootManager.state.getState('gs.globalResourceConfigList')['__groot_origin']

    const resourceTaskList = createResourceTaskList(resourceList)
    return {
      resourceList,
      resourceConfigList,
      resourceTaskList
    }
  }
}

const createFullMetadata = (viewId: number) => {
  if (!viewId) {
    throw new Error('viewId不能为空')
  }
  const { root, children } = viewCache.get(viewId)
  const instanceList = [root, ...children]

  const { groot: { extHandler } } = getContext();
  const propTaskList = []
  const appPropItemPipelineModuleList = extHandler.getPipeline('propItem', ExtensionLevel.Application)
  const viewPropItemPipelineModuleList = extHandler.getPipeline('propItem', ExtensionLevel.View, viewId)

  const metadataList = instanceList.map((instance) => {
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

    const solutionPropItemPipelineModuleList = extHandler.getPipeline('propItem', ExtensionLevel.Solution, viewId, instance.solutionId)

    const metadata = metadataFactory(instance.propTree, {
      packageName: instance.component.packageName,
      componentName: instance.component.componentName,
      metadataId: instance.id,
      viewId,
      parentMetadataId: instance.parentId,
      solutionInstanceId: instance.solutionInstanceId,
      componentVersionId: instance.componentVersion.id
    }, (params) => {
      pipelineExec<PropItemPipelineParams>({
        viewExtList: viewPropItemPipelineModuleList,
        appExtList: appPropItemPipelineModuleList,
        solutionExtList: solutionPropItemPipelineModuleList,
        params: {
          ...params,
          appendTask: propAppendTask(params.metadata, propTaskList, params.propKeyChain)
        }
      })
    }, true);
    return metadata;
  })

  return {
    metadataList,
    propTaskList
  }
}

const loadView = (viewId: number) => {
  const { request, groot: { loadExtension, launchExtension }, params } = getContext();
  const releaseId = +params.releaseId
  return request(APIPath.view_detailByViewIdAndReleaseId, { viewId, releaseId }).then(({ data: { instanceList, solutionInstanceList, viewExtensionInstanceList, resourceList, resourceConfigList } }) => {
    activeViewIdSet.add(viewId)
    const root = instanceList.find(item => !item.parentId)
    const children = instanceList.filter(item => !!item.parentId)
    viewCache.set(viewId, {
      children, root, solutionInstanceList, viewExtensionInstanceList, resourceList, resourceConfigList
    });

    [root, ...children].forEach((instance) => {
      const solutionInstance = solutionInstanceList.find(item => item.id === instance.solutionInstanceId)
      instance.solutionId = solutionInstance.solutionId;
    });

    const solutionInstanceListSort = [
      solutionInstanceList.find(item => !!item.primary),
      ...solutionInstanceList.filter(item => !item.primary)
    ]

    // 顺序不能错
    const viewExtPromise = loadExtension({ remoteExtensionList: viewExtensionInstanceList, extLevel: ExtensionLevel.View, viewId })
    const solutionExtPromiseList = solutionInstanceListSort.map(({ extensionInstanceList, solutionId }) => {
      return loadExtension({ remoteExtensionList: extensionInstanceList, extLevel: ExtensionLevel.Solution, solutionId, viewId })
    })

    // 加载入口级扩展插件和解决方案级扩展插件
    Promise.all([viewExtPromise, ...solutionExtPromiseList]).then(() => {

      launchExtension(viewExtensionInstanceList, ExtensionLevel.View)

      for (const { extensionInstanceList } of solutionInstanceListSort) {
        launchExtension(extensionInstanceList, ExtensionLevel.Solution)
      }

    })

    const { executeCommand } = grootManager.command

    const resourceData = executeCommand('gc.createResource', viewId)
    const metadataData = executeCommand('gc.createMetadata', viewId)

    return {
      ...resourceData,
      ...metadataData
    }
  });
}

const openView = (viewId: number, primaryView = true) => {
  const { executeCommand } = grootManager.command
  const { getState } = grootManager.state

  activeViewIdSet.forEach((id) => {
    executeCommand('gc.unloadView', id)
  })
  activeViewIdSet.clear()
  viewCache.clear()
  if (primaryView) {
    // todo 清空缓存数据
    return executeCommand('gc.loadView', viewId).then((data) => {
      const view = getState('gs.viewList').find(item => item.id === viewId)
      executeCommand('gc.stageRefresh', view.key, data)
      const { root } = viewCache.get(viewId)
      executeCommand('gc.switchIstance', root.id, viewId)
    })
  } else {
    throw new Error('方法未实装')
  }

}

const unloadView = (viewId: number) => {
  const { groot: { extHandler } } = getContext();

  [...(extHandler.solutionExt.get(viewId)?.entries() || [])].forEach(([solutionId, solutionExtMap]) => {
    [...solutionExtMap.values()].forEach(ext => {
      extHandler.uninstall({
        extInstanceId: ext.instance.id,
        level: ExtensionLevel.Solution,
        viewId,
        solutionId
      })
    })
  });

  [...(extHandler.viewExt.get(viewId)?.values() || [])].forEach((ext) => {
    extHandler.uninstall({
      extInstanceId: ext.instance.id,
      level: ExtensionLevel.View,
      viewId
    })
  })

  viewCache.delete(viewId)
  activeViewIdSet.delete(viewId)
}

const switchComponentInstance = (instanceId: number, viewId?: number) => {
  const { setState } = grootManager.state

  if (!viewId) {
    viewId = grootManager.state.getState('gs.view').viewId
  }
  if (!viewCache.has(viewId)) {
    throw new Error(`未找到view: ${viewId}`)
  }

  const view = viewCache.get(viewId)
  if (selectViewId !== viewId) {
    const { root, children, resourceList, resourceConfigList } = view

    setState('gs.localResourceList', resourceList)
    setState('gs.localResourceConfigList', resourceConfigList)

    selectViewId = viewId
    setState('gs.view', { viewId, root, children })
  }

  const instance = [view.root, ...view.children].find(item => item.id === instanceId);
  grootManager.state.setState('gs.activeComponentInstance', instance);
  grootManager.state.setState('gs.propTree', instance.propTree)
  grootManager.state.setState('gs.activePropGroupId', instance.propTree[0].id)
  grootManager.state.setState('gs.component', instance.component);
}