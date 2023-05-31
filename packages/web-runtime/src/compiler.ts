import { Metadata, PropMetadata, PropMetadataType, PropTask, StudioMode } from "@grootio/common";
import { controlMode, globalConfig, groot } from "./config";
import { launchWatch } from "./monitor";
import { wrapperProps } from "./reactive";


const viewEleContainer = new Map<string, Map<number, HTMLElement>>();
const viewMetadataContainer = new Map<string, Map<number, Metadata>>();
const propTaskContainer = new Map<string, Map<string, PropTask>>()


export const buildComponent = (metadata: Metadata, metadataList: Metadata[], propTaskList: PropTask[], viewKey: string) => {
  propTaskContainer.set(viewKey, new Map())
  viewEleContainer.set(viewKey, new Map())
  viewMetadataContainer.set(viewKey, new Map())

  if (controlMode === StudioMode.Instance && !metadata.parentId) {
    launchWatch(viewEleContainer.get(viewKey), viewMetadataContainer.get(viewKey));
  }

  return _buildComponent(metadata, viewKey, metadataList, propTaskList)
}

export const reBuildComponent = (metadata: Metadata, metadataList: Metadata[], propTaskList: PropTask[], viewKey: string) => {

  processAdvancedProp(metadata, viewKey, metadataList, propTaskList,);

  metadata.propsObj = wrapperProps(metadata.propsObj, metadata, viewKey)

  globalConfig.refreshComponent(metadata.id);
}

const _buildComponent = (metadata: Metadata, viewKey: string, metadataList: Metadata[], propTaskList: PropTask[]) => {

  processAdvancedProp(metadata, viewKey, metadataList, propTaskList,);

  metadata.propsObj = wrapperProps(metadata.propsObj, metadata, viewKey)

  return globalConfig.createComponent(metadata, viewEleContainer.get(viewKey), viewMetadataContainer.get(viewKey));

}

const processAdvancedProp = (metadata: Metadata, viewKey: string, metadataList: Metadata[], propTaskList: PropTask[]) => {

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
      ctx[endPropKey] = createComponentByValue(propMetadata, viewKey, metadataList, propTaskList);
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
    } else {
      let task = propTaskContainer.get(viewKey).get(propMetadata.type)

      if (task) {
        ctx[endPropKey] = task.mainFn(ctx[endPropKey], ctx, groot, globalConfig.shared, task.storage)
      } else {
        task = propTaskList.find(item => item.key === propMetadata.type)
        if (task) {
          initPropTask(task)
          propTaskContainer.get(viewKey).set(propMetadata.type, task)
          ctx[endPropKey] = task.mainFn(ctx[endPropKey], ctx, groot, globalConfig.shared, task.storage)
        } else {
          console.warn(`找不到属性任务:${propMetadata.type}`)
        }
      }
    }
  })

}

const createComponentByValue = (propMetadata: PropMetadata, viewKey: string, metadataList: Metadata[], propTaskList: PropTask[]) => {
  if (propMetadata.type !== PropMetadataType.Component) {
    throw new Error('参数错误')
  }

  const rootData = propMetadata.data
  const nodes = rootData.list.map((item) => {
    const metadata = metadataList.find(m => m.id === item.instanceId);
    if (!metadata) {
      throw new Error('数据异常');
    }
    metadata.$$runtime = {
      propItemId: rootData.$$runtime?.propItemId,
      abstractValueIdChain: rootData.$$runtime?.abstractValueIdChain
    }
    return _buildComponent(metadata, viewKey, metadataList, propTaskList);
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

function initPropTask(task: PropTask) {

  task.initFn = task.init ? new window.Function('_groot', '_shared', `
      'use strict';
      return function __grootTaskInit(_groot,_shared){
        let _storage;
        ${task.init}
        return _storage;
      }(_groot,_shared)
  `) as any : () => { }

  task.mainFn = new window.Function('_rawValue', '_props', '_groot', '_shared', '_storage', `
    'use strict';
    return function __grootTask(_rawValue,_props,_groot,_shared,_storage){
      let _value;
      ${task.main}
      return _value;
    }(_rawValue,_props,_groot,_shared,_storage);
  `) as any;

  task.destoryFn = task.destory ? new window.Function('_groot', '_shared', '_storage', `
      'use strict';
      return function __grootTaskDestory(_groot,_shared,_storage){
        ${task.destory}
      }(_groot,_shared,_storage);
  `) as any : () => { }

  task.storage = task.initFn(groot, globalConfig.shared)
}


export const destoryMetadata = (viewKey: string) => {
  propTaskContainer.get(viewKey).forEach(item => item.destoryFn(groot, globalConfig.shared, item.storage))
  propTaskContainer.delete(viewKey)
  viewEleContainer.delete(viewKey)
  viewMetadataContainer.delete(viewKey)
}