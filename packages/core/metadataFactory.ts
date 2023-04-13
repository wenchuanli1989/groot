import { Metadata, PropBlockStructType, PropGroup, PropItem, PropItemStruct, PropItemViewType, PropMetadataComponent, PropMetadataType, PropValue } from '@grootio/common';

import { fillPropChainGreed, fillPropChain } from './utils';

type PipelineType = (params: {
  ctx: Record<string, any>,
  propKey: string,
  value: any,
  propItem: PropItem,
  metadata: Metadata,
  propKeyChain: string,
  defaultFn: () => void
}) => void

let _pipeline: PipelineType
let _studioMode: boolean

export function metadataFactory(
  rootGroupList: PropGroup[],
  metadataInfo: {
    packageName: string,
    componentName: string,
    metadataId: number,
    rootMetadataId?: number,
    parentMetadataId?: number,
  }, pipeline?: PipelineType, studioMode = false) {

  const metadata = {
    id: metadataInfo.metadataId,
    packageName: metadataInfo.packageName,
    componentName: metadataInfo.componentName,
    propsObj: {},
    advancedProps: [],
    postPropTasks: {},
    parentId: metadataInfo.parentMetadataId,
    rootId: metadataInfo.rootMetadataId
  } as Metadata;
  _pipeline = pipeline
  _studioMode = studioMode

  rootGroupList.forEach((group) => {
    if (group.propKey) {
      const ctx = fillPropChainGreed(metadata.propsObj, group.propKey);
      buildPropObject(group, ctx, group.propKey, metadata);
    } else {
      buildPropObject(group, metadata.propsObj, '', metadata);
    }
  });

  return metadata;
}


function buildPropObject(group: PropGroup, ctx: Object, ctxKeyChain: string, metadata: Metadata, parentValueList?: PropValue[]) {
  group.propBlockList.forEach((block) => {
    const preCTX = ctx;
    const preCTXKeyChain = ctxKeyChain;

    if (block.propKey) {
      if (block.rootPropKey) {
        ctx = fillPropChainGreed(metadata.propsObj, block.propKey, block.struct === PropBlockStructType.List);
        ctxKeyChain = block.propKey;
      } else {
        ctx = fillPropChainGreed(ctx, block.propKey, block.struct === PropBlockStructType.List);
        ctxKeyChain += `.${block.propKey}`;
      }
    } else {
      if (block.struct === PropBlockStructType.List) {
        throw new Error('when block struct list, propKey cannot be empty');
      }
    }

    if (block.struct === PropBlockStructType.List) {
      const childPropItem = block.propItemList[0];
      const abstractValueIdChain = parentValueList?.map(v => v.id).join(',');
      const propValueList = childPropItem.valueList.filter(v => {
        return v.abstractValueIdChain === abstractValueIdChain || (!v.abstractValueIdChain && !abstractValueIdChain)
      });
      propValueList.forEach((propValue, propValueIndex) => {
        const preCTX = ctx;
        const preCTXKeyChain = ctxKeyChain;

        ctx = ctx[propValueIndex] = {};
        ctxKeyChain += `[${propValueIndex}]`;
        if (Array.isArray(parentValueList)) {
          parentValueList.push(propValue);
        } else {
          parentValueList = [propValue];
        }
        buildPropObject(childPropItem.childGroup, ctx, ctxKeyChain, metadata, parentValueList);
        parentValueList.pop();

        ctx = preCTX;
        ctxKeyChain = preCTXKeyChain;
      });
    } else {
      block.propItemList.forEach((propItem) => {
        const preCTX = ctx;
        const preCTXKeyChain = ctxKeyChain;

        buildPropObjectForItem(propItem, ctx, ctxKeyChain, metadata, parentValueList);

        ctx = preCTX;
        ctxKeyChain = preCTXKeyChain;
      });
    }

    ctx = preCTX;
    ctxKeyChain = preCTXKeyChain;
  })
}


function buildPropObjectForItem(item: PropItem, ctx: Object, ctxKeyChain: string, metadata: Metadata, parentValueList?: PropValue[]) {
  const preCTX = ctx;
  const preCTXKeyChain = ctxKeyChain;

  if (!item.propKey && !item.childGroup) {
    throw new Error('propKey can not empty');
  }

  if (item.childGroup) {
    if (item.rootPropKey) {
      ctx = fillPropChainGreed(metadata.propsObj, item.propKey);
      ctxKeyChain = item.propKey;
    } else {
      ctx = fillPropChainGreed(ctx, item.propKey);
      ctxKeyChain += `.${item.propKey}`;
    }

    buildPropObject(item.childGroup, ctx, ctxKeyChain, metadata, parentValueList);
  } else {
    buildPropObjectForLeafItem(item, ctx, ctxKeyChain, metadata, parentValueList);
  }

  ctx = preCTX;
  ctxKeyChain = preCTXKeyChain;
}


function buildPropObjectForLeafItem(propItem: PropItem, ctx: Object, propKeyChain: string, metadata: Metadata, parentValueList?: PropValue[]) {
  const [newCTX, propEnd] = fillPropChain(propItem.rootPropKey ? metadata.propsObj : ctx, propItem.propKey);
  propKeyChain = propItem.rootPropKey ? propItem.propKey : `${propKeyChain}.${propItem.propKey}`;
  propKeyChain = propKeyChain.replace(/^\.|\.$/g, '');

  let propValue = propItem.valueList[0];
  const abstractValueIdChain = parentValueList?.map(v => v.id).join(',');

  if (parentValueList?.length) {
    propValue = propItem.valueList.find((value) => value.abstractValueIdChain === abstractValueIdChain);
  }

  const value = propValue?.value || propItem.defaultValue

  const defaultFn = () => {
    if (typeof value === 'string' && value.length) {
      newCTX[propEnd] = JSON.parse(value.replace(/\n|\r/mg, ''));
    } else {
      newCTX[propEnd] = value
    }
  }

  if (propItem.struct === PropItemStruct.Normal) {
    if (propItem.viewType === PropItemViewType.Json) {
      metadata.advancedProps.push({
        keyChain: propKeyChain,
        type: PropMetadataType.Json,
      })
      defaultFn()
    } else if (propItem.viewType === PropItemViewType.Function) {
      metadata.advancedProps.push({
        keyChain: propKeyChain,
        type: PropMetadataType.Function,
      })
      defaultFn()
    } else {
      if (_pipeline) {
        _pipeline({ ctx: newCTX, propKey: propEnd, value, propItem, metadata, propKeyChain, defaultFn })
      } else {
        defaultFn()
      }
    }
  } else if (propItem.struct === PropItemStruct.Component) {
    const data = (!value ? { list: [] } : JSON.parse(value)) as PropMetadataComponent

    if (_studioMode) {
      data.$$runtime = {
        propItemId: propItem.id,
        propKeyChain: propKeyChain,
        abstractValueIdChain: abstractValueIdChain,
        parentId: metadata.id
      }
    }

    metadata.advancedProps.push({
      keyChain: propKeyChain,
      type: PropMetadataType.Component,
      data
    });
    // 最终value为组件实例id数组
    newCTX[propEnd] = data.list.map(item => item.instanceId);
  }
}
