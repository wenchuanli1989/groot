import { APIPath, Component, ExtensionLevel, PropBlockStructType, PropGroup, PropItemPipelineParams, propAppendTask } from "@grootio/common"
import { metadataFactory, pipelineExec, propTreeFactory } from "@grootio/core";
import { getContext, grootManager } from "context"
import { parseOptions } from "../util";

const componentCache = new Map<number, Component>()

export const prototypeBootstrap = () => {
  const { registerCommand } = grootManager.command
  const { registerState } = grootManager.state
  registerState('gs.solution', null, false)

  registerCommand('gc.createMetadata', (_, componentVersionId) => {
    const component = componentCache.get(componentVersionId)
    return createFullMetadata(component)
  })

  registerCommand('gc.openComponent', (_, componentVersionId) => {
    return openComponent(componentVersionId);
  })

  registerCommand('gc.loadComponent', (_, componentVersionId) => {
    return loadComponent(componentVersionId)
  })

  registerCommand('gc.navSolution', (_, solutionVersionId, componentVersionId) => {
    navSolution(solutionVersionId, componentVersionId)
  })

  getContext().groot.onReady(onReady)
}

const onReady = () => {
  const { setState } = grootManager.state
  const { groot: { loadExtension, launchExtension } } = getContext()

  const solutionVersionId = +getContext().params.solutionVersionId || null
  getContext().request(APIPath.solution_detailBySolutionVersionId, { solutionVersionId }).then(({ data: { extensionInstanceList, ...solution } }) => {
    setState('gs.solution', solution as any)
    setState('gs.stage.debugBaseUrl', solution.solutionVersion.debugBaseUrl)
    setState('gs.stage.playgroundPath', solution.solutionVersion.playgroundPath)

    // 以应用级别方式加载解决方案扩展插件
    loadExtension({ remoteExtensionList: extensionInstanceList, extLevel: ExtensionLevel.Application }).then(() => {

      launchExtension(extensionInstanceList, ExtensionLevel.Application)

      grootManager.hook.callHook('gh.allReady')
      getContext().layout.refresh()
    })
  })
}

const createFullMetadata = (component: Component) => {
  const { groot: { extHandler } } = getContext()

  if (!component.propTree) {
    const { groupList, blockList, itemList, valueList } = component;
    const propTree = propTreeFactory(groupList, blockList, itemList, valueList) as any as PropGroup[];
    groupList.forEach((group) => {
      if (!Array.isArray(group.expandBlockIdList)) {
        group.expandBlockIdList = group.propBlockList.map(block => block.id);
      }
    })
    component.propTree = propTree;
  }

  const propTaskList = []
  const propItemPipelineModuleList = extHandler.getPipeline('propItem', ExtensionLevel.Application)
  const metadata = metadataFactory(component.propTree, {
    packageName: component.packageName,
    componentName: component.componentName,
    metadataId: component.id,
    solutionInstanceId: null,
    componentVersionId: null
  }, (params) => {
    pipelineExec<PropItemPipelineParams>({
      appExtList: propItemPipelineModuleList,
      solutionExtList: [],
      entryExtList: [],
      params: {
        ...params,
        appendTask: propAppendTask(params.metadata, propTaskList, params.propKeyChain)
      }
    })
  }, true);

  return {
    metadataList: [metadata],
    propTaskList
  }
}

const openComponent = (componentVersionId: number) => {
  const { executeCommand } = grootManager.command

  return executeCommand('gc.loadComponent', componentVersionId).then((data) => {
    const { setState, getState } = grootManager.state
    const viewKey = getState('gs.stage.playgroundPath')
    executeCommand('gc.stageRefresh', viewKey, data)

    const component = componentCache.get(componentVersionId)
    setState('gs.propTree', component.propTree)
    setState('gs.activePropGroupId', component.propTree[0].id)
    setState('gs.component', component)
  })
}

const loadComponent = (componentVersionId: number) => {
  const solutionVersionId = +getContext().params.solutionVersionId
  return getContext().request(APIPath.component_detail_by_componentVersionId_and_solutionVersionId, { componentVersionId, solutionVersionId }).then(({ data: component }) => {
    const { executeCommand } = grootManager.command

    const { blockList, itemList } = component;
    blockList.filter(block => block.struct === PropBlockStructType.List).forEach((block) => {
      block.listStructData = JSON.parse(block.listStructData as any || '[]');
    })

    itemList.forEach(item => {
      parseOptions(item);
    })

    componentCache.set(componentVersionId, component)
    return executeCommand('gc.createMetadata', componentVersionId)
  })
}

const navSolution = (solutionVersionId: number, componentId?: number) => {
  if (!componentId) {
    location.href = `/studio?mode=prototype&solutionVersionId=${solutionVersionId}`
  }

  getContext().request(APIPath.componentVersion_get_by_solutionVersionId_and_componentId, { solutionVersionId, componentId }).then(({ data }) => {
    if (data) {
      location.href = `/studio?mode=prototype&solutionVersionId=${solutionVersionId}&componentVersionId=${data.id}`
    } else {
      location.href = `/studio?mode=prototype&solutionVersionId=${solutionVersionId}`
    }
  })
}
