import { Metadata, interpolationRegExp, interpolationRegExpSingle } from "@grootio/common";
import { getResourceList, getResourceManager, getMetadataIds } from "./resource";

let _metadata: Metadata

export const getMetadata = () => {
  return _metadata
}

export const wrapperProps = (props: Record<string, any>, metadata: Metadata, viewKey: string) => {
  getResourceList(viewKey).forEach(item => getMetadataIds(item.id).clear())
  return new Proxy(props, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key);
      if (typeof value !== 'string' || !interpolationRegExp.test(value)) {
        return Reflect.get(target, key, receiver);
      }

      _metadata = metadata
      const matchGroup = value.match(interpolationRegExp)

      const resourceManager = getResourceManager(viewKey)
      const globalResourceManager = getResourceManager(null)
      const nsKeyList = [...resourceManager.keys()].map(key => '$' + key).concat(
        [...globalResourceManager.keys()].map(key => '$$' + key)
      )
      const namespaceList = [...resourceManager.values(), ...globalResourceManager.values()].map(item => item.proxy)

      if (matchGroup[0] === value.trim()) {
        return expression(interpolationRegExp.exec(matchGroup[0])[2], nsKeyList, namespaceList)
      }

      return value.replace(interpolationRegExp, (matchStr) => {
        return expression(interpolationRegExpSingle.exec(matchStr)[2], nsKeyList, namespaceList)
      })

    }
  })
}

function expression(code: string, nsKeyList: string[], namespaceList: any[]) {
  let newFunction, result

  try {
    newFunction = new window.Function(...nsKeyList, `
    return ${code}
  `);

    try {
      result = newFunction(...namespaceList);
    } catch (e) {
      console.error('表达式结果异常')
    }
  } catch (e) {
    console.error('表达式编译异常')
  }

  return result || '*Null*'
}