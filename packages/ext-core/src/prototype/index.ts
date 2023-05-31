import { Component, PropGroup, PropItemPipelineParams, propAppendTask } from "@grootio/common"
import { metadataFactory, pipelineExec, propTreeFactory } from "@grootio/core";
import { getContext, grootManager } from "context"

export const prototypeBootstrap = () => {
  grootManager.command.registerCommand('gc.createMetadata', () => {
    const component = grootManager.state.getState('gs.component');
    return createFullMetadata(component)
  })
}

const createFullMetadata = (component: Component) => {
  const { groot: { extHandler }, params: { solution } } = getContext()

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
  const propItemPipelineModuleList = [...(extHandler.solution.get(solution.id)?.values() || [])].filter(ext => !!ext.propItemPipeline?.id).map(ext => ext.propItemPipeline)

  const metadata = metadataFactory(component.propTree, {
    packageName: component.packageName,
    componentName: component.componentName,
    metadataId: component.id,
    solutionInstanceId: null,
    componentVersionId: null
  }, (params) => {
    pipelineExec<PropItemPipelineParams>([], [], propItemPipelineModuleList, {
      ...params,
      appendTask: propAppendTask(metadata, propTaskList, params.propKeyChain)
    })
  }, true);

  return {
    metadataList: [metadata],
    propTaskList
  }
}