import { PropGroup, PropItemPipelineParams } from "@grootio/common";
import { metadataFactory, pipeline, propTreeFactory } from "@grootio/core";
import { getContext, grootManager } from "context";


export const prototypeBootstrap = () => {
  const { groot, } = getContext();
  const { registerCommand } = grootManager.command


  registerCommand('gc.makeDataToStage', (_, refreshId) => {
    syncDataToStage(refreshId === 'first');
  })

  groot.onReady(() => {
  })
}


const syncDataToStage = (first = false) => {
  const { groot: { extHandler }, params: { solution } } = getContext()
  const component = grootManager.state.getState('gs.component');

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

  const propItemPipelineModuleList = [...(extHandler.solution.get(solution.id)?.values() || [])].filter(ext => !!ext.propItemPipeline?.id).map(ext => ext.propItemPipeline)

  const metadata = metadataFactory(component.propTree, {
    packageName: component.packageName,
    componentName: component.componentName,
    metadataId: component.id,
    solutionInstanceId: null,
    componentVersionId: null
  }, (params) => {
    pipeline<PropItemPipelineParams>([], [], propItemPipelineModuleList, params)
  }, true);
  grootManager.hook.callHook('gh.component.propChange', metadata, first)
}