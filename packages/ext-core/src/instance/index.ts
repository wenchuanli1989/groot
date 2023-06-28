import { APIPath, ComponentInstance, ExtensionInstance, ExtensionLevel, PropBlockStructType, PropGroup, PropItemPipelineParams, Release, Resource, ResourceConfig, SolutionInstance, propAppendTask } from "@grootio/common"
import { metadataFactory, pipelineExec, propTreeFactory } from '@grootio/core'
import { getContext, grootManager } from "context"
import { parseOptions } from "../util"
import { createResourceTaskList } from "util/resource"

const entryCache = new Map<number, {
  root: ComponentInstance,
  children: ComponentInstance[],
  solutionInstanceList: SolutionInstance[],
  entryExtensionInstanceList: ExtensionInstance[],
  resourceList: Resource[],
  resourceConfigList: ResourceConfig[]
}>()
const activeEntryIdSet = new Set<number>()
let selectEntryId: number

export const instanceBootstrap = () => {

  const { registerCommand } = grootManager.command
  const { registerState } = grootManager.state

  registerState('gs.release', null, false)
  registerState('gs.app', null, false)
  registerState('gs.entryList', null, true)
  registerState('gs.globalResourceList', null, true)
  registerState('gs.globalResourceConfigList', null, true)
  registerState('gs.activeComponentInstance', null, false)
  registerState('gs.localResourceList', null, true)
  registerState('gs.localResourceConfigList', null, true)
  registerState('gs.entry', null, false)


  registerCommand('gc.createMetadata', (_, entryId) => {
    return createFullMetadata(entryId)
  })

  registerCommand('gc.createResource', (_, entryId) => {
    return createResource(entryId)
  })

  registerCommand('gc.loadEntry', (_, entryId) => {
    return loadEntry(entryId);
  })

  registerCommand('gc.openEntry', (_, entryId, mainEntry) => {
    return openEntry(entryId, mainEntry)
  })

  registerCommand('gc.unloadEntry', (_, entryId) => {
    unloadEntry(entryId)
  })

  registerCommand('gc.switchIstance', (_, instanceId, entryId) => {
    switchComponentInstance(instanceId, entryId)
  })

  getContext().groot.onReady(onReady)

}

const onReady = () => {
  const { groot: { loadExtension, launchExtension } } = getContext()
  const { setState } = grootManager.state
  const releaseId = +getContext().params.releaseId || null

  getContext().request(APIPath.application_detailByReleaseId, { releaseId }).then(({ data: { release, entryList, resourceList, resourceConfigList, extensionInstanceList, ...app } }) => {
    setState('gs.release', release)
    setState('gs.app', app as any)
    setState('gs.stage.debugBaseUrl', release.debugBaseUrl || app.debugBaseUrl)
    setState('gs.stage.playgroundPath', release.playgroundPath || app.playgroundPath)
    setState('gs.entryList', entryList)
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

const createResource = (entryId: number) => {
  if (entryId) {
    if (!entryCache.has(entryId)) throw new Error('未知entryId')

    const { resourceList, resourceConfigList } = entryCache.get(entryId)
    const resourceTaskList = createResourceTaskList(resourceList, entryId)

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

const createFullMetadata = (entryId: number) => {
  if (!entryId) {
    throw new Error('entryId不能为空')
  }
  const { root, children } = entryCache.get(entryId)
  const instanceList = [root, ...children]

  const { groot: { extHandler } } = getContext();
  const propTaskList = []
  const appPropItemPipelineModuleList = extHandler.getPipeline('propItem', ExtensionLevel.Application)
  const entryPropItemPipelineModuleList = extHandler.getPipeline('propItem', ExtensionLevel.Entry, entryId)

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

    const solutionPropItemPipelineModuleList = extHandler.getPipeline('propItem', ExtensionLevel.Solution, entryId, instance.solutionId)

    const metadata = metadataFactory(instance.propTree, {
      packageName: instance.component.packageName,
      componentName: instance.component.componentName,
      metadataId: instance.id,
      rootMetadataId: instance.rootId,
      parentMetadataId: instance.parentId,
      solutionInstanceId: instance.solutionInstanceId,
      componentVersionId: instance.componentVersion.id
    }, (params) => {
      pipelineExec<PropItemPipelineParams>({
        entryExtList: entryPropItemPipelineModuleList,
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

const loadEntry = (entryId: number) => {
  const { request, groot: { loadExtension, launchExtension }, params } = getContext();
  const releaseId = +params.releaseId
  return request(APIPath.componentInstance_entryDetailByEntryIdAndReleaseId, { entryId, releaseId }).then(({ data: { children, root, solutionInstanceList, entryExtensionInstanceList, resourceList, resourceConfigList } }) => {
    activeEntryIdSet.add(entryId)
    entryCache.set(root.id, {
      children, root, solutionInstanceList, entryExtensionInstanceList, resourceList, resourceConfigList
    });

    [root, ...children].forEach((instance) => {
      const solutionInstance = solutionInstanceList.find(item => item.id === instance.solutionInstanceId)
      instance.solutionId = solutionInstance.solutionId;
    });

    const solutionInstanceListSort = [
      solutionInstanceList.find(item => !!item.solutionEntry),
      ...solutionInstanceList.filter(item => !item.solutionEntry)
    ]

    // 顺序不能错
    const entryExtPromise = loadExtension({ remoteExtensionList: entryExtensionInstanceList, extLevel: ExtensionLevel.Entry, entryId })
    const solutionExtPromiseList = solutionInstanceListSort.map(({ extensionInstanceList, solutionId }) => {
      return loadExtension({ remoteExtensionList: extensionInstanceList, extLevel: ExtensionLevel.Solution, solutionId, entryId })
    })

    // 加载入口级扩展插件和解决方案级扩展插件
    Promise.all([entryExtPromise, ...solutionExtPromiseList]).then(() => {

      launchExtension(entryExtensionInstanceList, ExtensionLevel.Entry)

      for (const { extensionInstanceList } of solutionInstanceListSort) {
        launchExtension(extensionInstanceList, ExtensionLevel.Solution)
      }

    })

    const { executeCommand } = grootManager.command

    const resourceData = executeCommand('gc.createResource', entryId)
    const metadataData = executeCommand('gc.createMetadata', entryId)

    return {
      ...resourceData,
      ...metadataData
    }
  });
}

const openEntry = (entryId: number, mainEntry = true) => {
  const { executeCommand } = grootManager.command
  const { getState } = grootManager.state

  activeEntryIdSet.forEach((id) => {
    executeCommand('gc.unloadEntry', id)
  })
  activeEntryIdSet.clear()
  entryCache.clear()
  if (mainEntry) {
    // todo 清空缓存数据
    return executeCommand('gc.loadEntry', entryId).then((data) => {
      const entry = getState('gs.entryList').find(item => item.id === entryId)
      executeCommand('gc.stageRefresh', entry.key, data)
      executeCommand('gc.switchIstance', entryId, entryId)
    })
  } else {
    throw new Error('方法未实装')
  }

}

const unloadEntry = (entryId: number) => {
  const { groot: { extHandler } } = getContext();

  [...(extHandler.solutionExt.get(entryId)?.entries() || [])].forEach(([solutionId, solutionExtMap]) => {
    [...solutionExtMap.values()].forEach(ext => {
      extHandler.uninstall({
        extInstanceId: ext.instance.id,
        level: ExtensionLevel.Solution,
        entryId,
        solutionId
      })
    })
  });

  [...(extHandler.entryExt.get(entryId)?.values() || [])].forEach((ext) => {
    extHandler.uninstall({
      extInstanceId: ext.instance.id,
      level: ExtensionLevel.Entry,
      entryId
    })
  })

  entryCache.delete(entryId)
  activeEntryIdSet.delete(entryId)
}

const switchComponentInstance = (instanceId: number, entryId?: number) => {
  const { setState } = grootManager.state

  if (!entryId) {
    entryId = grootManager.state.getState('gs.entry').root.id
  }
  if (!entryCache.has(entryId)) {
    throw new Error(`未找到entry: ${entryId}`)
  }

  const entry = entryCache.get(entryId)
  if (selectEntryId !== entryId) {
    const { root, children, resourceList, resourceConfigList } = entry

    setState('gs.localResourceList', resourceList)
    setState('gs.localResourceConfigList', resourceConfigList)

    selectEntryId = entryId
    setState('gs.entry', { root, children })
  }

  const instance = [entry.root, ...entry.children].find(item => item.id === instanceId);
  grootManager.state.setState('gs.activeComponentInstance', instance);
  grootManager.state.setState('gs.propTree', instance.propTree)
  grootManager.state.setState('gs.activePropGroupId', instance.propTree[0].id)
  grootManager.state.setState('gs.component', instance.component);
}