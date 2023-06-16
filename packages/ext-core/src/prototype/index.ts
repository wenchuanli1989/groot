import { APIPath, Component, ExtensionLevel, PropBlockStructType, PropGroup, PropItemPipelineParams, propAppendTask } from "@grootio/common"
import { metadataFactory, pipelineExec, propTreeFactory } from "@grootio/core";
import { getContext, grootManager } from "context"
import { parseOptions } from "../util";


export const prototypeBootstrap = () => {
  const { registerCommand } = grootManager.command
  const { registerState } = grootManager.state
  registerState('gs.solution', null, false)

  registerCommand('gc.createMetadata', () => {
    const component = grootManager.state.getState('gs.component');
    return createFullMetadata(component)
  })

  registerCommand('gc.loadComponent', (_, componentVersionId) => {
    return loadComponent(componentVersionId);
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

      grootManager.hook.callHook('gh.startWork')
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

const loadComponent = (versionId: number) => {
  return getContext().request(APIPath.componentPrototype_detailByVersionId, { versionId }).then(({ data: component }) => {
    const { blockList, itemList } = component;
    blockList.filter(block => block.struct === PropBlockStructType.List).forEach((block) => {
      block.listStructData = JSON.parse(block.listStructData as any || '[]');
    })

    itemList.forEach(item => {
      parseOptions(item);
    })

    const { setState } = grootManager.state
    setState('gs.component', component)

    const { executeCommand } = grootManager.command
    const data = executeCommand('gc.createMetadata')

    return {
      component,
      ...data
    }
  })
}
