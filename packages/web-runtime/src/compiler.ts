import { Metadata, PropMetadata, PropMetadataType, StudioMode } from "@grootio/common";
import { controlMode, globalConfig, groot } from "./config";
import { launchWatch } from "./monitor";
import { wrapperProps } from "./reactive";


const viewEleMap = new Map<number, HTMLElement>();
const viewMetadataMap = new Map<number, Metadata>();
const propItemTaskContainer = new Map<string, Map<string, Function>>()

let _viewKey: string
let _metadataList: Metadata[]
let _propTaskList: Record<string, any>

export const buildComponent = (metadata: Metadata, metadataList: Metadata[], propTaskList: Record<string, any>, viewKey: string) => {
  _metadataList = metadataList
  _propTaskList = propTaskList
  _viewKey = viewKey
  propItemTaskContainer.set(viewKey, new Map())

  if (controlMode === StudioMode.Instance && !metadata.parentId) {
    launchWatch(viewEleMap, viewMetadataMap);
  }

  _buildComponent(metadata)
}

export const reBuildComponent = (metadata: Metadata, metadataList: Metadata[], viewKey: string, propTaskList?: Record<string, any>) => {
  _metadataList = metadataList
  _propTaskList = propTaskList
  _viewKey = viewKey

  processAdvancedProp(metadata);

  metadata.propsObj = wrapperProps(metadata.propsObj, metadata, viewKey)

  globalConfig.refreshComponent(metadata.id);
}

const _buildComponent = (metadata: Metadata) => {

  processAdvancedProp(metadata);

  metadata.propsObj = wrapperProps(metadata.propsObj, metadata, _viewKey)

  return globalConfig.createComponent(metadata, viewEleMap, viewMetadataMap);

}

const processAdvancedProp = (metadata: Metadata) => {

  metadata.advancedProps?.forEach((propMetadata) => {
    const keys = propMetadata.keyChain.split('.');
    const endPropKey = keys[keys.length - 1];
    let ctx = metadata.propsObj;

    // 找到属性对应的值
    keys.slice(0, -1).forEach((key) => {
      if (key.endsWith(']')) {
        const [preKey, index] = key.split(/\[|\]/);
        ctx = ctx[preKey][index];
      } else {
        ctx = ctx[key];
      }
    })

    if (propMetadata.type === PropMetadataType.Component) {
      ctx[endPropKey] = createComponentByValue(propMetadata);
    } else if (propMetadata.type === PropMetadataType.Json) {
      try {
        ctx[endPropKey] = JSON.parse(ctx[endPropKey]);
      } catch (e) {
        console.error(`高级属性解析失败  ${keys}:${ctx[endPropKey]}`)
        ctx[endPropKey] = undefined;
      }
    } else if (propMetadata.type === PropMetadataType.Function) {
      try {
        ctx[endPropKey] = functionCreate(ctx[endPropKey], ctx);
      } catch (e) {
        console.error(`高级属性解析失败  ${keys}:${ctx[endPropKey]}`)
        ctx[endPropKey] = undefined;
      }
    } else if (_propTaskList && _propTaskList[propMetadata.type]) {
      const propItemTaskMap = propItemTaskContainer.get(_viewKey)
      const task = createPropItemTask(_propTaskList[propMetadata.type])
      propItemTaskMap.set(propMetadata.type, task)
      ctx[endPropKey] = task(ctx[endPropKey], groot, ctx, globalConfig.shared)
    } else {
      const propItemTaskMap = propItemTaskContainer.get(_viewKey)
      let task = propItemTaskMap.get(propMetadata.type)

      if (!task) {
        console.warn(`未知的任务:${propMetadata.type}`)
      } else {
        ctx[endPropKey] = task(ctx[endPropKey], groot, ctx, globalConfig.shared)
      }
    }
  })

}

const createComponentByValue = (propMetadata: PropMetadata) => {
  if (propMetadata.type !== PropMetadataType.Component) {
    throw new Error('参数错误')
  }

  const rootData = propMetadata.data
  const nodes = rootData.list.map((item) => {
    const metadata = _metadataList.find(m => m.id === item.instanceId);
    if (!metadata) {
      throw new Error('数据异常');
    }
    metadata.$$runtime = {
      propItemId: rootData.$$runtime?.propItemId,
      abstractValueIdChain: rootData.$$runtime?.abstractValueIdChain
    }
    return _buildComponent(metadata);
  });

  (nodes as any)._groot = rootData;

  return nodes;
}

function functionCreate(functionCode: string, props: Object) {
  const newFunction = new window.Function('_props', '_groot', '_shared', `
    'use strict';
    return function __grootFn(_groot,_props,_shared){
      let _exportFn;
      ${functionCode}
      return _exportFn;
    }(_groot,_props,_shared);
  `);

  return newFunction(props, groot, globalConfig.shared);
}

function createPropItemTask(taskCode: string) {
  const newFunction = new window.Function('_rawValue', '_groot', '_props', '_shared', `
    'use strict';
    return function __grootTask(_rawValue,_groot,_props,_shared){
      let _value;
      ${taskCode}
      return _value;
    }(_rawValue,_groot,_props,_shared);
  `);

  return newFunction
}