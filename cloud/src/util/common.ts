import { ExtScriptModule, ExtensionHandler, ExtensionLevel, ExtensionInstance as IExtensionInstance } from "@grootio/common";
import { wrap } from "@mikro-orm/core";
import { AppResource } from "entities/AppResource";
import { ExtensionInstance } from "entities/ExtensionInstance";
import { ViewResource } from "entities/ViewResource";
import { ResourceConfig } from "entities/ResourceConfig";
import { NodeVM } from "vm2";


export function isDevMode() {
  return process.env.NODE_ENV !== 'production'
}

export function autoIncrementForName(names: string[]) {

  const serial = names
    .map(g => g.replace(/^\D+/mg, ''))
    .map(s => parseInt(s) || 0)
    .sort((a, b) => b - a)[0] || 0;

  const nameSuffix = serial ? serial + 1 : names.length + 1;

  return nameSuffix;
}

export function parseResource(resource: AppResource | ViewResource, resourceConfigMap: Map<number, ResourceConfig>) {
  const _resource = resource.imageResource ? resource.imageResource : resource

  const resourceConfig = _resource.resourceConfig;
  if (resourceConfig) {
    resourceConfigMap.set(resourceConfig.id, wrap(resourceConfig).toObject())
  }
  return wrap(_resource).toObject();
}

const vm2 = new NodeVM()

// 创建ExtScriptModule模块赋值给插件
export function installPipelineModule(
  { list, level, extHandler, viewId, solutionId }: {
    list: ExtensionInstance[],
    level: ExtensionLevel,
    extHandler: ExtensionHandler,
    viewId?: number,
    solutionId?: number
  }
) {
  for (const item of list) {
    const extInstance = wrap(item).toObject() as IExtensionInstance
    // 一定要先加载安装在初始化 module
    const success = extHandler.install({
      extInstance, level, solutionId, viewId,
      extId: extInstance.extension.id,
      extAssetUrl: extInstance.extensionVersion.assetUrl
    })

    const { extensionVersion } = item

    if (success && extensionVersion) {
      const resourcePipelineModuleCode = extensionVersion.resourcePipelineRaw?.text
      const propItemPipelineModuleCode = extensionVersion.propItemPipelineRaw?.text

      if (resourcePipelineModuleCode) {
        const resourceModule = vm2.run(resourcePipelineModuleCode) as ExtScriptModule
        resourceModule.id = extInstance.id;
        extInstance.resourcePipeline = resourceModule;
      }

      if (propItemPipelineModuleCode) {
        const propItemModule = vm2.run(propItemPipelineModuleCode) as ExtScriptModule
        propItemModule.id = extInstance.id;
        extInstance.propItemPipeline = propItemModule;
      }
    }
  }
}
