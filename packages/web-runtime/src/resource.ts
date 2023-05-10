import { Resource } from "@grootio/common";

export const resourceManager = new Map<string, Record<string, any>>();

const _namespaceMap = new Map<any, any>();

export const initResource = (resourceList: Resource[]) => {
  const nsKeyList: string[] = []
  resourceList.map(item => {
    if (!nsKeyList.includes(item.type)) {
      nsKeyList.push(item.type)
      createNamespace(item.type)
    }
    // todo 插件定制逻辑
    _namespaceMap.get(resourceManager.get(item.type))[item.name] = item.value
  })

  return nsKeyList
}

export const destoryResource = (nsKeyList: string[]) => {
  nsKeyList.forEach(key => {
    resourceManager.delete(key)
  })
}

export const updateResource = (type: string, name: string, value: any) => {
  if (!resourceManager.has(type)) {
    createNamespace(type)
  }
  // todo 插件定制逻辑
  _namespaceMap.get(resourceManager.get(type))[name] = value
}

export const removeResource = (type: string, name: string) => {
  delete _namespaceMap.get(resourceManager.get(type))[name]
}

const createNamespace = (nsKey: string) => {
  const namespace = {}
  const secureNamespace = createSecureNamespace(namespace)
  _namespaceMap.set(secureNamespace, namespace)
  resourceManager.set(nsKey, secureNamespace)
}

const createSecureNamespace = (namespace) => {
  return new Proxy(namespace, {
    get: (target, key, receiver) => {
      return Reflect.get(target, key, receiver)
    },
    set: (target, key, value, receiver) => {
      if (target.hasOwnProperty(key)) {
        return Reflect.set(target, key, value, receiver)
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