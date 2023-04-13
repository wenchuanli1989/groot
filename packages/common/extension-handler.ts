import { ExtensionLevel, ExtensionStatus } from './enum'
import { ExtensionInstance } from './entities'

export const createExtensionHandler = () => {
  const extensionMap = {
    application: new Map<number, ExtensionInstance>(),
    solution: new Map<number, Map<number, ExtensionInstance>>(),
    entry: new Map<number, ExtensionInstance>(),
    runtime: {
      byAssetUrlMap: new Map<string, ExtensionInstance>(),
      byExtIdMap: new Map<number, ExtensionInstance>()
    }
  }

  const install = (extensionInstance: ExtensionInstance, level: ExtensionLevel, solutionInstanceId?: number) => {

    if (level === ExtensionLevel.Application) {
      if (extensionMap.application.has(extensionInstance.id)) {
        throw new Error('重复加载扩展实例[app]')
      }
      extensionMap.application.set(extensionInstance.id, extensionInstance)
    } else if (level === ExtensionLevel.Solution) {
      if (!extensionMap.solution.has(solutionInstanceId!)) {
        extensionMap.solution.set(solutionInstanceId!, new Map<number, ExtensionInstance>())
      }
      const map = extensionMap.solution.get(solutionInstanceId!)!
      if (map.has(extensionInstance.id)) {
        throw new Error('重复加载扩展实例[solution]')
      }
      map.set(extensionInstance.id, extensionInstance)
    } else {
      if (extensionMap.entry.has(extensionInstance.id)) {
        throw new Error('重复加载扩展实例[entry]')
      }
      extensionMap.entry.set(extensionInstance.id, extensionInstance)
    }

    const extensionId = extensionInstance.extension.id;
    const assetUrl = extensionInstance.extensionVersion.assetUrl
    if (extensionMap.runtime.byExtIdMap.has(extensionId)) {
      extensionInstance.status = ExtensionStatus.Conflict
    } else if (extensionMap.runtime.byAssetUrlMap.has(assetUrl)) {
      extensionInstance.status = ExtensionStatus.ConflictUrl
    } else {
      extensionInstance.status = ExtensionStatus.Active
      extensionMap.runtime.byExtIdMap.set(extensionId, extensionInstance)
      extensionMap.runtime.byAssetUrlMap.set(assetUrl, extensionInstance)
    }

    return extensionInstance.status === ExtensionStatus.Active
  }

  const uninstall = (extensionInstanceId: number, level: ExtensionLevel, solutionInstanceId?: number) => {

    let extensionInstance: ExtensionInstance;
    if (level === ExtensionLevel.Application) {
      if (extensionMap.application.has(extensionInstanceId)) {
        extensionInstance = extensionMap.application.get(extensionInstanceId)
        extensionInstance.status = ExtensionStatus.Destroy
        extensionMap.application.delete(extensionInstanceId)
      }
    } else if (level === ExtensionLevel.Solution) {
      if (extensionMap.solution.has(solutionInstanceId!)) {
        const map = extensionMap.solution.get(solutionInstanceId!)!
        if (map.has(extensionInstanceId)) {
          extensionInstance = map.get(extensionInstanceId)
          extensionInstance.status = ExtensionStatus.Destroy
          map.delete(extensionInstanceId)
        }
      }
    } else {
      if (extensionMap.entry.has(extensionInstanceId)) {
        extensionInstance = extensionMap.entry.get(extensionInstanceId)
        extensionInstance.status = ExtensionStatus.Destroy
        extensionMap.entry.delete(extensionInstanceId)
      }
    }

    if (!extensionInstance) {
      return false
    }

    const extensionId = extensionInstance.extension.id;
    const assetUrl = extensionInstance.extensionVersion.assetUrl

    if (extensionMap.runtime.byExtIdMap.get(extensionId)?.id === extensionInstanceId) {
      extensionMap.runtime.byExtIdMap.delete(extensionId)
      extensionInstance.status = ExtensionStatus.Uninstall
    }
    if (extensionMap.runtime.byAssetUrlMap.get(assetUrl)?.id === extensionInstanceId) {
      extensionInstance.status = ExtensionStatus.Uninstall
      extensionMap.runtime.byAssetUrlMap.delete(assetUrl)
    }

    return extensionInstance.status === ExtensionStatus.Uninstall
  }

  return {
    ...extensionMap,
    install,
    uninstall
  }
}
