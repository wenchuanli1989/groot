import { ExtensionLevel, ExtensionStatus } from './enum'
import { ExtensionInstance } from './entities'
import { ExtensionHandler } from './extension'

export const createExtensionHandler = () => {
  const dataStore = {
    appExt: new Map<number, { instance: ExtensionInstance, extId: number, extAssetUrl: string }>(),// extInstanceId: extInstance
    solutionExt: new Map<number, Map<number, Map<number, { instance: ExtensionInstance, extId: number, extAssetUrl: string }>>>(),// viewId: {solutionId: {extInstanceId: extInstance}}
    viewExt: new Map<number, Map<number, { instance: ExtensionInstance, extId: number, extAssetUrl: string }>>(),// viewId: {extInstanceId: extInstance}

    runtime: {
      extByIdMap: new Map<number, { referCount: number, extInstance: ExtensionInstance, extId: number }>(),// extId: ...
      extByAssetUrlMap: new Map<string, number>(),// extVersionUrl: extId
    }
  }

  // 单个层级不允许出现相同的插件实例
  // 出现重复插件，只有第一个插件状态是Active，否则状态为Conflict
  const install = ({ extInstance, level, solutionId, viewId, extId, extAssetUrl }: { extInstance: ExtensionInstance, level: ExtensionLevel, extId: number, extAssetUrl: string, solutionId?: number, viewId?: number }) => {

    if (level === ExtensionLevel.Application) {
      if (dataStore.appExt.has(extInstance.id)) {
        extInstance.status = ExtensionStatus.Padding
        throw new Error('应用级别扩展实例重复加载')
      } else {
        dataStore.appExt.set(extInstance.id, { instance: extInstance, extId, extAssetUrl })
      }
    } else if (level === ExtensionLevel.View) {
      if (!viewId) {
        throw new Error('参数viewId不能为空')
      }

      if (!dataStore.viewExt.has(viewId)) {
        dataStore.viewExt.set(viewId, new Map())
      }

      const map = dataStore.viewExt.get(viewId!)!
      if (map.has(extInstance.id)) {
        extInstance.status = ExtensionStatus.Padding
        throw new Error('view级别扩展实例重复加载')
      } else {
        map.set(extInstance.id, { instance: extInstance, extId, extAssetUrl })
      }
    } else {
      if (!viewId) {
        throw new Error('参数viewId不能为空')
      } else if (!solutionId) {
        throw new Error('参数solutionId不能为空')
      }

      // if (!dataStore.entrySolution.has(viewId)) {
      //   dataStore.entrySolution.set(viewId, new Set())
      // }

      if (!dataStore.solutionExt.has(viewId)) {
        dataStore.solutionExt.set(viewId, new Map())
      }

      if (!dataStore.solutionExt.get(viewId).has(solutionId)) {
        dataStore.solutionExt.get(viewId).set(solutionId, new Map())
      }

      const map = dataStore.solutionExt.get(viewId).get(solutionId)
      if (map.has(extInstance.id)) {
        extInstance.status = ExtensionStatus.Padding
        console.log('解决方案级别扩展实例重复加载')
      } else {
        map.set(extInstance.id, { instance: extInstance, extId, extAssetUrl })
        // dataStore.entrySolution.get(viewId).add(solutionId)
      }
    }


    if (dataStore.runtime.extByIdMap.has(extId)) {
      const extData = dataStore.runtime.extByIdMap.get(extId)

      // 校验不同插件共用同一个资源地址
      if (dataStore.runtime.extByAssetUrlMap.has(extAssetUrl)) {
        if (extData.extId !== extId) {
          extInstance.status = ExtensionStatus.Padding
          throw new Error('扩展实例url地址冲突')
        } else {
          extData.referCount += 1
          extInstance.status = ExtensionStatus.Conflict
        }
      } else {
        extInstance.status = ExtensionStatus.Padding
        throw new Error('数据异常')
      }
    } else {
      extInstance.status = ExtensionStatus.Active
      dataStore.runtime.extByIdMap.set(extId, { referCount: 1, extInstance, extId })
      dataStore.runtime.extByAssetUrlMap.set(extAssetUrl, extId)

      // if (level === ExtensionLevel.Solution) {
      //   if (!dataStore.runtime.solutionByIdMap.has(solutionId)) {
      //     dataStore.runtime.solutionByIdMap.set(solutionId, new Set())
      //   }

      //   dataStore.runtime.solutionByIdMap.get(solutionId).add(viewId)
      // }
    }

    return extInstance.status === ExtensionStatus.Active
  }

  const uninstall = ({ extInstanceId, level, viewId, solutionId }: { extInstanceId: number, level: ExtensionLevel, viewId?: number, solutionId?: number }) => {

    if (level === ExtensionLevel.Application) {
      if (dataStore.appExt.has(extInstanceId)) {
        const { instance: extInstance, extId } = dataStore.appExt.get(extInstanceId)

        const result = destory(extInstance, extId)
        if (extInstance.status === ExtensionStatus.Destroy) {
          dataStore.appExt.delete(extInstanceId)
        }
        return result
      }
    } else if (level === ExtensionLevel.View) {
      if (!viewId) {
        throw new Error('参数viewId不能为空')
      }

      if (dataStore.viewExt.get(viewId)?.has(extInstanceId)) {
        const { instance: extInstance, extId } = dataStore.viewExt.get(viewId).get(extInstanceId)

        const result = destory(extInstance, extId)
        if (extInstance.status === ExtensionStatus.Destroy) {
          dataStore.viewExt.get(viewId).delete(extInstanceId)
        }
        return result
      }
    } else {
      if (!viewId) {
        throw new Error('参数viewId不能为空')
      } else if (!solutionId) {
        throw new Error('参数solutionId不能为空')
      }

      if (dataStore.solutionExt.get(viewId)?.get(solutionId)?.has(extInstanceId)) {
        const map = dataStore.solutionExt.get(viewId).get(solutionId)
        const { instance: extInstance, extId } = map.get(extInstanceId)

        const result = destory(extInstance, extId)
        if (extInstance.status === ExtensionStatus.Destroy) {
          map.delete(extInstanceId)
        }
        return result
      }
    }

    return false
  }

  // 返回值代表插件是否卸载成功，
  const destory = (extInstance: ExtensionInstance, extId: number) => {
    const extData = dataStore.runtime.extByIdMap.get(extId)

    if (!extData) {
      throw new Error('未找到对应类型插件')
    } else if (extData.referCount === 1) {
      const assetUrl = extData.extInstance.extensionVersion.assetUrl

      if (dataStore.runtime.extByAssetUrlMap.get(assetUrl) === extId) {
        dataStore.runtime.extByAssetUrlMap.delete(assetUrl)
      } else {
        throw new Error('数据异常')
      }

      extData.extInstance.status = ExtensionStatus.Destroy
      extInstance.status = ExtensionStatus.Destroy
      dataStore.runtime.extByIdMap.delete(extId)

      extData.extInstance?.destory()

      return true
    } else {
      extData.referCount -= 1;// 无论如何都会减一
      if (extData.extInstance.id !== extInstance.id) {
        extInstance.status = ExtensionStatus.Destroy
      }

      return false
    }
  }

  const getPipeline = (type: 'propItem' | 'resource', level: ExtensionLevel, viewId?: number, solutionId?: number) => {
    const pipeline = (instance: ExtensionInstance) => {
      return type === 'propItem' ? instance.propItemPipeline : instance.resourcePipeline
    }

    if (level === ExtensionLevel.Application) {
      return [...(dataStore.appExt.values() || [])]
        .filter(({ instance }) => instance.status === ExtensionStatus.Active && !!pipeline(instance)?.id)
        .map(({ instance }) => pipeline(instance))
    } else if (level === ExtensionLevel.View) {
      return [...(dataStore.viewExt.get(viewId)?.values() || [])]
        .filter(({ instance }) => instance.status === ExtensionStatus.Active && !!pipeline(instance)?.id)
        .map(({ instance }) => pipeline(instance))
    } else if (level === ExtensionLevel.Solution) {
      if (solutionId) {
        return [...(dataStore.solutionExt.get(viewId)?.get(solutionId)?.values() || [])]
          .filter(({ instance }) => instance.status === ExtensionStatus.Active && !!pipeline(instance)?.id)
          .map(({ instance }) => pipeline(instance))
      } else {
        return [...(dataStore.solutionExt.get(viewId)?.values() || [])].reduce((totalList, currSolutionExtMap) => {
          const currSolutionExtList = [...(currSolutionExtMap.values() || [])]
          currSolutionExtList.forEach(({ instance }) => {
            if (instance.status === ExtensionStatus.Active && pipeline(instance)?.id) {
              totalList.push(pipeline(instance))
            }
          })
          return totalList;
        }, [])
      }
    }

    return []
  }

  return {
    ...dataStore,
    install,
    uninstall,
    getPipeline
  } as ExtensionHandler
}
