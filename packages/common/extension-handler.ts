import { ExtensionLevel, ExtensionStatus } from './enum'
import { ExtensionInstance } from './entities'
import { ExtensionHandler } from './extension'

export const createExtensionHandler = () => {
  const dataStore = {
    appExt: new Map<number, { instance: ExtensionInstance, extId: number, extAssetUrl: string }>(),// extInstanceId: extInstance
    solutionExt: new Map<number, Map<number, Map<number, { instance: ExtensionInstance, extId: number, extAssetUrl: string }>>>(),// entryId: {solutionId: {extInstanceId: extInstance}}
    entryExt: new Map<number, Map<number, { instance: ExtensionInstance, extId: number, extAssetUrl: string }>>(),// entryId: {extInstanceId: extInstance}

    runtime: {
      extByIdMap: new Map<number, { referCount: number, extInstance: ExtensionInstance, extId: number }>(),// extId: ...
      extByAssetUrlMap: new Map<string, number>(),// extVersionUrl: extId
    }
  }

  // 单个层级不允许出现相同的插件实例
  // 出现重复插件，只有第一个插件状态是Active，否则状态为Conflict
  const install = ({ extInstance, level, solutionId, entryId, extId, extAssetUrl }: { extInstance: ExtensionInstance, level: ExtensionLevel, extId: number, extAssetUrl: string, solutionId?: number, entryId?: number }) => {

    if (level === ExtensionLevel.Application) {
      if (dataStore.appExt.has(extInstance.id)) {
        extInstance.status = ExtensionStatus.Padding
        throw new Error('应用级别扩展实例重复加载')
      } else {
        dataStore.appExt.set(extInstance.id, { instance: extInstance, extId, extAssetUrl })
      }
    } else if (level === ExtensionLevel.Entry) {
      if (!entryId) {
        throw new Error('参数entryId不能为空')
      }

      if (!dataStore.entryExt.has(entryId)) {
        dataStore.entryExt.set(entryId, new Map())
      }

      const map = dataStore.entryExt.get(entryId!)!
      if (map.has(extInstance.id)) {
        extInstance.status = ExtensionStatus.Padding
        throw new Error('entry级别扩展实例重复加载')
      } else {
        map.set(extInstance.id, { instance: extInstance, extId, extAssetUrl })
      }
    } else {
      if (!entryId) {
        throw new Error('参数entryId不能为空')
      } else if (!solutionId) {
        throw new Error('参数solutionId不能为空')
      }

      // if (!dataStore.entrySolution.has(entryId)) {
      //   dataStore.entrySolution.set(entryId, new Set())
      // }

      if (!dataStore.solutionExt.has(entryId)) {
        dataStore.solutionExt.set(entryId, new Map())
      }

      if (!dataStore.solutionExt.get(entryId).has(solutionId)) {
        dataStore.solutionExt.get(entryId).set(solutionId, new Map())
      }

      const map = dataStore.solutionExt.get(entryId).get(solutionId)
      if (map.has(extInstance.id)) {
        extInstance.status = ExtensionStatus.Padding
        console.log('解决方案级别扩展实例重复加载')
      } else {
        map.set(extInstance.id, { instance: extInstance, extId, extAssetUrl })
        // dataStore.entrySolution.get(entryId).add(solutionId)
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

      //   dataStore.runtime.solutionByIdMap.get(solutionId).add(entryId)
      // }
    }

    return extInstance.status === ExtensionStatus.Active
  }

  const uninstall = ({ extInstanceId, level, entryId, solutionId }: { extInstanceId: number, level: ExtensionLevel, entryId?: number, solutionId?: number }) => {

    if (level === ExtensionLevel.Application) {
      if (dataStore.appExt.has(extInstanceId)) {
        const { instance: extInstance, extId } = dataStore.appExt.get(extInstanceId)

        const result = destory(extInstance, extId)
        if (extInstance.status === ExtensionStatus.Destroy) {
          dataStore.appExt.delete(extInstanceId)
        }
        return result
      }
    } else if (level === ExtensionLevel.Entry) {
      if (!entryId) {
        throw new Error('参数entryId不能为空')
      }

      if (dataStore.entryExt.get(entryId)?.has(extInstanceId)) {
        const { instance: extInstance, extId } = dataStore.entryExt.get(entryId).get(extInstanceId)

        const result = destory(extInstance, extId)
        if (extInstance.status === ExtensionStatus.Destroy) {
          dataStore.entryExt.get(entryId).delete(extInstanceId)
        }
        return result
      }
    } else {
      if (!entryId) {
        throw new Error('参数entryId不能为空')
      } else if (!solutionId) {
        throw new Error('参数solutionId不能为空')
      }

      if (dataStore.solutionExt.get(entryId)?.get(solutionId)?.has(extInstanceId)) {
        const map = dataStore.solutionExt.get(entryId).get(solutionId)
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

  const getPipeline = (type: 'propItem' | 'resource', level: ExtensionLevel, entryId?: number, solutionId?: number) => {
    const pipeline = (instance: ExtensionInstance) => {
      return type === 'propItem' ? instance.propItemPipeline : instance.resourcePipeline
    }

    if (level === ExtensionLevel.Application) {
      return [...(dataStore.appExt.values() || [])]
        .filter(({ instance }) => instance.status === ExtensionStatus.Active && !!pipeline(instance)?.id)
        .map(({ instance }) => pipeline(instance))
    } else if (level === ExtensionLevel.Entry) {
      return [...(dataStore.entryExt.get(entryId)?.values() || [])]
        .filter(({ instance }) => instance.status === ExtensionStatus.Active && !!pipeline(instance)?.id)
        .map(({ instance }) => pipeline(instance))
    } else if (level === ExtensionLevel.Solution) {
      if (solutionId) {
        return [...(dataStore.solutionExt.get(entryId)?.get(solutionId)?.values() || [])]
          .filter(({ instance }) => instance.status === ExtensionStatus.Active && !!pipeline(instance)?.id)
          .map(({ instance }) => pipeline(instance))
      } else {
        return [...(dataStore.solutionExt.get(entryId)?.values() || [])].reduce((totalList, currSolutionExtMap) => {
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
