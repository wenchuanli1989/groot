import { Resource, ResourceConfig, ResourceTask } from "@grootio/common";
import { globalConfig, groot } from "./config";
import { getMetadata } from "./reactive";

// viewKey -> nsKey
const namespaceManagerContainer = new Map<string, Map<string, { origin: any, proxy: any, resourceMap: Map<string, Resource> }>>();
// resourceId -> metadataId
const metadataIdsMap = new Map<number, Set<number>>()
// viewKey -> resource
const resourceListMap = new Map<string, Resource[]>()
// viewKey -> Task
const resourceTaskListMap = new Map<string, ResourceTask[]>()

export const getResourceManager = (viewKey: string) => {
  return namespaceManagerContainer.get(viewKey)
}

export const getResourceList = (viewKey: string) => {
  return resourceListMap.get(viewKey)
}

export const getMetadataIds = (resourceId: number) => {
  return metadataIdsMap.get(resourceId)
}

// 要考虑一个页面有多个全局组件情况
export const buildResource = (resourceList: Resource[] = [], viewKey: string, taskList: ResourceTask[] = [], configList: ResourceConfig[] = [],) => {
  const resourceObj = {}
  const resourceConfigMap = new Map<number, ResourceConfig>()
  const resourceTaskMap = new Map<string, ResourceTask>()
  namespaceManagerContainer.set(viewKey, new Map())
  resourceListMap.set(viewKey, resourceList)
  resourceTaskListMap.set(viewKey, taskList)

  // 初始化资源配置
  configList.forEach(config => resourceConfigMap.set(config.id, config))
  // 初始化资源任务
  taskList.forEach(task => {
    initResourceTask(task)
    resourceTaskMap.set(task.key, task)
  })

  resourceList.forEach(resource => {
    // 每次构建都重置metadataId映射
    metadataIdsMap.set(resource.id, new Set())
    let namespace = resourceObj[resource.namespace]
    if (!namespace) {
      namespace = createNamespace(resource.namespace, viewKey)
      resourceObj[resource.namespace] = namespace
    }

    namespaceManagerContainer.get(viewKey).get(resource.namespace).resourceMap.set(resource.name, resource)

    if (resource.taskName) {
      let task = resourceTaskMap.get(resource.taskName)
      const config = resourceConfigMap.get(resource.resourceConfigId)
      if (!task) {
        console.warn(`找不到资源任务:${resource.taskName}`)
      }
      if (!config) {
        console.warn(`找不到资源配置信息:${resource.resourceConfigId}`)
      }

      const descriptor = task.mainFn(resource.value, resource, config, refresh(resource), groot, globalConfig.shared, task.storage)
      Object.defineProperty(namespace, resource.name, descriptor)
    } else {
      namespace[resource.name] = resource.value
    }
  })
}


export const destoryResource = (viewKey: string) => {
  resourceListMap.get(viewKey).forEach(item => metadataIdsMap.delete(item.id))
  resourceListMap.delete(viewKey)
  resourceTaskListMap.get(viewKey).forEach(item => item.destoryFn(groot, globalConfig.shared, item.storage))
  resourceTaskListMap.delete(viewKey)
  namespaceManagerContainer.delete(viewKey)
}

export const updateResource = (type: string, name: string, value: any) => {
}

export const removeResource = (type: string, name: string) => {
}

const createNamespace = (nsKey: string, viewKey: string) => {
  const namespace = {}
  const secureNamespace = createSecureNamespace(namespace, nsKey, viewKey)
  let resourceManager = namespaceManagerContainer.get(viewKey)
  resourceManager.set(nsKey, { origin: namespace, proxy: secureNamespace, resourceMap: new Map() })
  return namespace
}

// 读取属性时搜集依赖，防护属性写入，禁止非法操作
const createSecureNamespace = (namespace: Record<string, any>, nsKey: string, viewKey: string) => {
  return new Proxy(namespace, {
    get: (target, key, receiver) => {
      // 每次都取最新resource引用
      const resource = namespaceManagerContainer.get(viewKey).get(nsKey).resourceMap.get(key as string)
      const metadata = getMetadata()
      metadataIdsMap.get(resource.id).add(metadata.id)
      return Reflect.get(target, key, receiver)
    },
    set: (target, key, value, receiver) => {
      if (target.hasOwnProperty(key)) {
        // 每次都取最新resource引用
        const resource = namespaceManagerContainer.get(viewKey).get(nsKey).resourceMap.get(key as string)
        const result = Reflect.set(target, key, value, receiver)
        if (result) {
          _refresh(resource)
        }
        return result
      } else {
        throw new Error('禁止对Resource添加自定义属性')
      }
    },
    defineProperty: () => {
      return false
    },
    preventExtensions: () => {
      return false
    },
    setPrototypeOf: () => {
      return false
    },
    getPrototypeOf: () => {
      throw new Error('禁止访问resource对象原型')
    },
    deleteProperty: () => {
      return false
    }
  })
}

function initResourceTask(task: ResourceTask) {

  task.initFn = task.init ? new window.Function('_groot', '_shared', `
    'use strict';
    return function __grootTaskInit(_groot,_shared){
      let _storage;
      ${task.init}
      return _storage;
    }(_groot,_shared)
  `) as any : () => { }

  task.mainFn = new window.Function('_rawValue', '_resource', '_config', '_refresh', '_groot', '_shared', '_storage', `
    'use strict';
    return function __grootTaskMain(_rawValue,_resource,_config,_refresh,_groot,_shared,_storage){
      let _value;
      ${task.main}
      return _value;
    }(_rawValue,_resource,_config,_refresh,_groot,_shared,_storage);
  `) as any

  task.destoryFn = task.destory ? new window.Function('_groot', '_shared', '_storage', `
    'use strict';
    return function __grootTaskDestory(_groot,_shared,_storage){
      ${task.destory}
    }(_groot,_shared,_storage);
  `) as any : () => { }

  task.storage = task.initFn(groot, globalConfig.shared)
}

function refresh(resource: Resource) {
  return () => {
    _refresh(resource)
  }
}

function _refresh(resource: Resource) {
  [...metadataIdsMap.get(resource.id)].forEach(metadataId => {
    globalConfig.refreshComponent(metadataId);
  })
}