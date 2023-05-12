import { ComponentInstance, PropBlockStructType, PropGroup, PropItemPipelineParams } from "@grootio/common";
import { metadataFactory, pipelineExec, propTreeFactory } from "@grootio/core";
import { getContext, grootManager } from "context";
import { parseOptions } from "../util";


export const instanceBootstrap = () => {
  const { groot } = getContext();
  const { registerState, getState, watchState } = grootManager.state;
  const { registerCommand } = grootManager.command;
  const { callHook } = grootManager.hook;



  registerState('gs.propSetting.breadcrumbList', [], true)


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
    watchState('gs.componentInstance', updateBreadcrumbList)
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
      pipelineExec<PropItemPipelineParams>(entryPropItemPipelineModuleList, releasePropItemPipelineModuleList, solutionPropItemPipelineModuleList, params)
    }, true);
    return metadata;
  })
}

const updateBreadcrumbList = (newInstance: ComponentInstance) => {
  const { getState } = grootManager.state
  const list = getState('gs.allComponentInstance')
  const breadcrumbList = grootManager.state.getState('gs.propSetting.breadcrumbList')
  breadcrumbList.length = 0;

  let ctxInstance = newInstance;
  do {
    breadcrumbList.push({ id: ctxInstance.id, name: ctxInstance.name });
    ctxInstance = list.find((item) => item.id === ctxInstance.parentId);
  } while (ctxInstance);
  breadcrumbList.reverse();
}