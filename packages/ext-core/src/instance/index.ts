import { ComponentInstance, PropBlockStructType, PropGroup, PropItemPipelineParams } from "@grootio/common"
import { metadataFactory, pipelineExec, propTreeFactory } from '@grootio/core'
import { getContext, grootManager } from "context"
import { parseOptions } from "../util"
import { createResourceTaskList } from "util/resource"

export const instanceBootstrap = () => {

  grootManager.command.registerCommand('gc.createMetadata', () => {
    const list = grootManager.state.getState('gs.allComponentInstance')
    return createFullMetadata(list)
  })

  grootManager.command.registerCommand('gc.createResource', (_, isLocalResource) => {
    return createFullResource(isLocalResource)
  })
}

const createFullMetadata = (instanceList: ComponentInstance[]) => {
  const { groot: { extHandler } } = getContext();
  const propTaskList = []
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

    const entryPropItemPipelineModuleList = [...extHandler.entry.values()].filter(ext => !!ext.propItemPipeline?.id).map(ext => ext.propItemPipeline)
    const releasePropItemPipelineModuleList = [...extHandler.application.values()].filter(ext => !!ext.propItemPipeline?.id).map(ext => ext.propItemPipeline)
    const solutionPropItemPipelineModuleList = [...(extHandler.solution.get(instance.id)?.values() || [])].filter(ext => !!ext.propItemPipeline?.id).map(ext => ext.propItemPipeline)

    const metadata = metadataFactory(instance.propTree, {
      packageName: instance.component.packageName,
      componentName: instance.component.componentName,
      metadataId: instance.id,
      rootMetadataId: instance.rootId,
      parentMetadataId: instance.parentId,
      solutionInstanceId: instance.solutionInstanceId,
      componentVersionId: instance.componentVersion.id
    }, (params) => {
      params.appendTask = (taskName, taskCode) => {
        propTaskList.push({ key: taskName, content: taskCode })
      }
      pipelineExec<PropItemPipelineParams>(entryPropItemPipelineModuleList, releasePropItemPipelineModuleList, solutionPropItemPipelineModuleList, params)
    }, true);
    return metadata;
  })

  return {
    metadataList,
    propTaskList
  }
}

const createFullResource = (isLocalResource: boolean) => {
  const resourceList = grootManager.state.getState(isLocalResource ? 'gs.localResourceList' : 'gs.globalResourceList')
  const resourceConfigList = grootManager.state.getState(isLocalResource ? 'gs.localResourceConfigList' : 'gs.globalResourceConfigList')
  const resourceTaskList = createResourceTaskList(isLocalResource)

  return { resourceList: resourceList['__groot_origin'], resourceConfigList: resourceConfigList['__groot_origin'], resourceTaskList }
}
