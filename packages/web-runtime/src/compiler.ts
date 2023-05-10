import { Metadata, PropMetadata, PropMetadataType, StudioMode } from "@grootio/common";
import { controlMode, globalConfig, groot } from "./config";
import { launchWatch } from "./monitor";
import { wrapperProp } from "./reactive";


const viewEleMap = new Map<number, HTMLElement>();
const viewMetadataMap = new Map<number, Metadata>();

export const buildComponent = (metadata: Metadata, store: Metadata[], isRoot = false) => {
  if (controlMode === StudioMode.Instance) {
    launchWatch(viewEleMap, viewMetadataMap);
  }

  processAdvancedProp(metadata, store);

  metadata.propsObj = wrapperProp(metadata.propsObj)

  return globalConfig.createComponent(metadata, isRoot, viewEleMap, viewMetadataMap);
}

export const reBuildComponent = (metadata: Metadata, store: Metadata[]) => {
  processAdvancedProp(metadata, store);

  metadata.propsObj = wrapperProp(metadata.propsObj)

  globalConfig.refreshComponent(metadata.id);
}

const processAdvancedProp = (metadata: Metadata, store: Metadata[]) => {

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
      ctx[endPropKey] = createComponentByValue(propMetadata, store);
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
    } else if (metadata.postPropTasks[propMetadata.type]) {
      ctx[endPropKey] = taskCreate(metadata.postPropTasks[propMetadata.type], ctx[endPropKey], ctx)
    }
  })

}

const createComponentByValue = (propMetadata: PropMetadata, store: Metadata[]) => {
  if (propMetadata.type !== PropMetadataType.Component) {
    throw new Error('参数错误')
  }

  const rootData = propMetadata.data
  const nodes = rootData.list.map((item) => {
    const metadata = store.find(m => m.id === item.instanceId);
    if (!metadata) {
      throw new Error('数据异常');
    }
    metadata.$$runtime = {
      propItemId: rootData.$$runtime?.propItemId,
      abstractValueIdChain: rootData.$$runtime?.abstractValueIdChain
    }
    return buildComponent(metadata, store);
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

function taskCreate(taskCode: string, rawValue: string, props: Object) {
  const newFunction = new window.Function('_rawValue', '_props', '_groot', '_shared', `
    'use strict';
    return function __grootTask(_rawValue,_groot,_props,_shared){
      let _value;
      ${taskCode}
      return _value;
    }(_rawValue,_groot,_props,_shared);
  `);

  return newFunction(rawValue, props, groot, globalConfig.shared);
}