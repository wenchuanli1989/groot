import { Resource, ResourceConfig } from "@grootio/common";
import { globalConfig, groot } from "./config";
import { getMetadata } from "./reactive";

// viewKey -> nsKey
const resourceManagerContainer = new Map<string, Map<string, { origin: any, proxy: any, resourceMap: Map<string, Resource> }>>();
// resourceId -> metadataId
const metadataIdsMap = new Map<number, Set<number>>()
// viewKey -> resource
const resourceListMap = new Map<string, Resource[]>()

export const getResourceManager = (viewKey: string) => {
  return resourceManagerContainer.get(viewKey)
}

export const getResourceList = (viewKey: string) => {
  return resourceListMap.get(viewKey)
}

export const getMetadataIds = (resourceId: number) => {
  return metadataIdsMap.get(resourceId)
}

// 要考虑一个页面有多个全局组件情况
export const buildResource = (resourceList: Resource[], viewKey: string, taskList: { key: string, content: string }[] = [], configList: ResourceConfig[] = [],) => {
  const resourceObj = {}
  const resourceConfigMap = new Map()
  const resourceTaskMap = new Map()
  resourceManagerContainer.set(viewKey, new Map())
  resourceListMap.set(viewKey, resourceList)

  configList.forEach(config => resourceConfigMap.set(config.id, config))
  taskList.forEach(item => {
    const task = createResourceTask(item.content)
    resourceTaskMap.set(item.key, task)
  })

  resourceList.forEach(resource => {
    metadataIdsMap.set(resource.id, new Set())
    let namespace = resourceObj[resource.namespace]
    if (!namespace) {
      namespace = createNamespace(resource.namespace, viewKey)
      resourceObj[resource.namespace] = namespace
    }

    resourceManagerContainer.get(viewKey).get(resource.namespace).resourceMap.set(resource.name, resource)

    if (resource.taskName) {
      let task = resourceTaskMap.get(resource.taskName)
      const config = resourceConfigMap.get(resource.resourceConfigId)
      if (!task) {
        console.warn(`找不到资源任务:${resource.taskName}`)
      }
      if (!config) {
        console.warn(`找不到资源配置信息:${resource.resourceConfigId}`)
      }

      const descriptor = task(resource.value, resource, config, refresh(resource), groot, globalConfig.shared)
      Object.defineProperty(namespace, resource.name, descriptor)
    } else {
      namespace[resource.name] = resource.value
    }
  })
}


export const destoryResource = (viewKey: string) => {
  resourceListMap.get(viewKey)?.forEach(item => metadataIdsMap.delete(item.id))
  resourceListMap.delete(viewKey)
  resourceManagerContainer.delete(viewKey)
}

export const updateResource = (type: string, name: string, value: any) => {
}

export const removeResource = (type: string, name: string) => {
}

const createNamespace = (nsKey: string, viewKey: string) => {
  const namespace = {}
  const secureNamespace = createSecureNamespace(namespace, nsKey, viewKey)
  let resourceManager = resourceManagerContainer.get(viewKey)
  resourceManager.set(nsKey, { origin: namespace, proxy: secureNamespace, resourceMap: new Map() })
  return namespace
}

const createSecureNamespace = (namespace: Record<string, any>, nsKey: string, viewKey: string) => {
  return new Proxy(namespace, {
    get: (target, key, receiver) => {
      const resource = resourceManagerContainer.get(viewKey).get(nsKey).resourceMap.get(key as string)
      const metadata = getMetadata()
      metadataIdsMap.get(resource.id).add(metadata.id)
      return Reflect.get(target, key, receiver)
    },
    set: (target, key, value, receiver) => {
      if (target.hasOwnProperty(key)) {
        const resource = resourceManagerContainer.get(viewKey).get(nsKey).resourceMap.get(key as string)
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

function createResourceTask(taskCode: string) {
  const newFunction = new window.Function('_rawValue', '_resource', '_config', '_refresh', '_groot', '_shared', `
    'use strict';
    return function __grootTask(_rawValue,_resource,_config,_refresh,_groot,_shared){
      let _value;
      ${taskCode}
      return _value;
    }(_rawValue,_resource,_config,_refresh,_groot,_shared);
  `);

  return newFunction
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