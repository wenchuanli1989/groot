import {
  ApplicationData, DeployStatusType, EnvType,
  PropGroup as IPropGroup, PropBlock as IPropBlock, PropItem as IPropItem, PropValue as IPropValue, EnvTypeStr,
  ExtScriptModule, ExtensionRelationType, createExtensionHandler, ExtensionLevel, ExtensionInstance as IExtensionInstance, PropItemPipelineParams, ResourcePipelineParams, ViewData, Resource
} from '@grootio/common';
import { EntityManager, RequestContext, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { propTreeFactory, metadataFactory, pipelineExec } from '@grootio/core';


import { LogicException, LogicExceptionCode } from 'config/logic.exception';
import { Application } from 'entities/Application';
import { ComponentInstance } from 'entities/ComponentInstance';
import { Release } from 'entities/Release';
import { Bundle } from 'entities/Bundle';
import { BundleAsset } from 'entities/BundleAsset';
import { DeployManifest } from 'entities/DeployManifest';
import { Deploy } from 'entities/Deploy';
import { PropValue } from 'entities/PropValue';
import { PropGroup } from 'entities/PropGroup';
import { PropBlock } from 'entities/PropBlock';
import { PropItem } from 'entities/PropItem';
import { NodeVM } from 'vm2';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { SolutionInstance } from 'entities/SolutionInstance';
import { LargeText } from 'entities/LargeText';
import { AppResource } from 'entities/AppResource';
import { InstanceResource } from 'entities/InstanceResource';


const vm2 = new NodeVM()
@Injectable()
export class AssetService {

  async instanceDetail(assetId: number) {
    const em = RequestContext.getEntityManager();

    const asset = await em.findOne(BundleAsset, assetId, { populate: ['content'] });

    LogicException.assertNotFound(asset, 'InstanceAsset', assetId);

    return asset.content.text;
  }

  async appReleaseDetail(appKey: string, appEnv: EnvTypeStr) {
    const em = RequestContext.getEntityManager();

    const application = await em.findOne(Application, { key: appKey });

    LogicException.assertNotFound(application, 'Application', `key: ${appKey}`);

    const release = {
      [EnvTypeStr.Dev]: application.devRelease,
      [EnvTypeStr.Qa]: application.qaRelease,
      [EnvTypeStr.Pl]: application.plRelease,
      [EnvTypeStr.Ol]: application.onlineRelease
    }[appEnv];

    const manifest = await em.findOne(DeployManifest, { release }, { orderBy: { createdAt: 'DESC' }, populate: ['content'] });

    LogicException.assertNotFound(manifest, 'DeployManifest', `releaseId: ${release.id}`);

    return manifest.content.text;
  }

  async build(releaseId: number) {
    const em = RequestContext.getEntityManager();

    // 必要校验
    LogicException.assertParamEmpty(releaseId, 'releaseId');
    const release = await em.findOne(Release, releaseId);
    LogicException.assertNotFound(release, 'Release', releaseId);
    const application = await em.findOne(Application, release.application.id);

    const extHandler = createExtensionHandler();
    const instanceToViewDataMap = new Map<ComponentInstance, ViewData>();
    const appData = {
      name: application.name,
      key: application.key,
      viewList: [],
      resourceList: [],
      resourceConfigList: [],
      resourceTaskList: [],
      envData: []
    } as ApplicationData

    // 加载应用级别插件
    const appExtensionInstanceList = await em.find(ExtensionInstance, {
      relationId: releaseId,
      relationType: ExtensionRelationType.Application,
    }, { populate: ['extensionVersion.propItemPipelineRaw', 'extension'] })
    this.installPipelineModule(appExtensionInstanceList, ExtensionLevel.Application, extHandler)

    // 处理全局资源
    const appResourceExtScriptModuleList = [...extHandler.application.values()].filter(ext => !!ext.resourcePipeline).map(ext => ext.resourcePipeline)
    const appResourceList = await em.find(AppResource, {
      app: application,
      release
    }, { populate: ['imageResource'] })
    appResourceList.map(resource => {
      if (resource.imageResource) {
        return wrap(resource.imageResource).toObject() as any as AppResource;
      }
      return wrap(resource).toObject() as AppResource;
    }).forEach(resource => {
      // delete resource.app;
      // delete resource.release
      // delete resource.imageResource
      pipelineExec<ResourcePipelineParams>([], [], appResourceExtScriptModuleList, {
        resource: resource as any,
        defaultFn: () => { },
        appendTask: (taskName, taskCode) => {
          (resource as any).taskName = taskName
          appData.resourceTaskList.push({ key: taskName, content: taskCode })
        }
      })

      if (resource.resourceConfig) {
        appData.resourceConfigList.push(resource.resourceConfig)
        // resource.resourceConfigId = resource.resourceConfig.id
        // delete resource.resourceConfig
      }
      appData.resourceList.push(resource as any)
    })


    const appPropItemExtScriptModuleList = [...extHandler.application.values()].filter(ext => !!ext.propItemPipeline).map(ext => ext.propItemPipeline)
    const rootInstanceList = await em.find(ComponentInstance, { release, root: null }, { populate: ['solutionInstance', 'component'] });
    for (let rootInstance of rootInstanceList) {
      const viewData = {
        key: '',
        url: '',
        metadataList: [],
        resourceList: [],

        // propTasks的key和advancedProps的type关联对应
        propTaskMap: {},
        resourceTaskMap: {},
        resourceConfigMap: {}
      } as ViewData

      const solutionInstanceList = await em.find(SolutionInstance, {
        entry: rootInstance
      })

      // 加载解决方案级别插件
      for (const solutionInstance of solutionInstanceList) {
        const solutionExtensionInstanceList = await em.find(ExtensionInstance, {
          relationId: solutionInstance.solutionVersion.id,
          relationType: ExtensionRelationType.Solution
        }, { populate: ['extensionVersion.propItemPipelineRaw', 'extension'] })

        this.installPipelineModule(solutionExtensionInstanceList, ExtensionLevel.Solution, extHandler, solutionInstance.id)
      }
      const solutionResourceExtScriptModuleList = [...extHandler.solution.values()].reduce((pre, curr) => {
        pre.push([...curr.values()])
        return pre;
      }, [])

      // 加载实例级别插件
      const entryExtensionInstanceList = await em.find(ExtensionInstance, {
        relationId: rootInstance.id,
        relationType: ExtensionRelationType.Entry
      }, { populate: ['extensionVersion.propItemPipelineRaw', 'extension'] })
      this.installPipelineModule(entryExtensionInstanceList, ExtensionLevel.Entry, extHandler)
      const entryPropItemExtScriptModuleList = [...extHandler.entry.values()].filter(item => !!item.propItemPipeline).map(item => item.propItemPipeline)
      const entryResourceExtScriptModuleList = [...extHandler.entry.values()].filter(item => !!item.resourcePipeline).map(item => item.resourcePipeline)

      // 处理实例资源
      const entryResourceList = await em.find(InstanceResource, {
        componentInstance: rootInstance
      }, { populate: ['imageResource'] })
      entryResourceList.map(resource => {
        if (resource.imageResource) {
          return wrap(resource.imageResource).toObject() as any as InstanceResource;
        }
        return wrap(resource).toObject() as any as InstanceResource;
      }).forEach(resource => {
        // delete resource.release
        // delete resource.componentInstance
        // delete resource.imageResource
        pipelineExec<ResourcePipelineParams>(entryResourceExtScriptModuleList, solutionResourceExtScriptModuleList, appResourceExtScriptModuleList, {
          resource: resource as any,
          defaultFn: () => { },
          appendTask: (taskName, taskCode) => {
            (resource as any).taskName = taskName
            viewData.resourceTaskList.push({ key: taskName, content: taskCode })
          }
        })

        if (resource.resourceConfig) {
          viewData.resourceConfigList.push(resource.resourceConfig);
          // resource.resourceConfigId = resource.resourceConfig.id
          // delete resource.resourceConfig
        }
        viewData.resourceList.push(resource as any)
      })

      // 生成根实例metadata
      const solutionPropItemExtScriptModuleList = [...(extHandler.solution.get(rootInstance.solutionInstance.id)?.values() || [])].filter(item => !!item.propItemPipeline).map(item => item.propItemPipeline)
      const rootMetadata = await this.createMetadata(rootInstance, em, appPropItemExtScriptModuleList, solutionPropItemExtScriptModuleList, entryPropItemExtScriptModuleList, viewData);
      viewData.metadataList.push(rootMetadata);

      const childInstanceList = await em.find(ComponentInstance, { root: rootInstance }, { populate: ['component', 'componentVersion', 'solutionInstance'] });

      // 生成子实例metadata
      for (let childInstance of childInstanceList) {
        const solutionPropItemExtScriptModuleList = [...(extHandler.solution.get(childInstance.solutionInstance.id)?.values() || [])].filter(item => !!item.propItemPipeline).map(item => item.propItemPipeline)

        const childMetadata = await this.createMetadata(childInstance, em, appPropItemExtScriptModuleList, solutionPropItemExtScriptModuleList, entryPropItemExtScriptModuleList, viewData);
        viewData.metadataList.push(childMetadata);
      }

      instanceToViewDataMap.set(rootInstance, viewData);

      // 卸载实例级别插件
      for (const extInstance of extHandler.entry.values()) {
        extHandler.uninstall(extInstance.id, ExtensionLevel.Entry)
      }

      // 卸载解决方案级别插件
      for (const [solutionInstanceId, map] of extHandler.solution) {
        for (const extInstance of map.values()) {
          extHandler.uninstall(extInstance.id, ExtensionLevel.Solution, solutionInstanceId)
        }
      }
    }

    const bundle = em.create(Bundle, {
      release,
      application,
    });

    await em.begin();
    try {
      // 创建bundle
      await em.flush();

      // 创建InstanceAsset
      const newAssetList = [];

      for (const instance of rootInstanceList) {

        const content = em.create(LargeText, {
          text: JSON.stringify(instanceToViewDataMap.get(instance))
        })

        await em.flush()

        const asset = em.create(BundleAsset, {
          content,
          entry: instance,
          bundle,
          manifestKey: instance.key
        });

        await em.flush()

        appData.viewList.push({
          key: asset.manifestKey,
          url: `http://groot-local.com:10000/asset/instance/${asset.id}`
        })
        newAssetList.push(asset);
      }

      const manifestLargeText = em.create(LargeText, {
        text: JSON.stringify(appData)
      })
      await em.flush()

      bundle.manifest = manifestLargeText
      await em.flush();

      // 更新newAssetList
      newAssetList.forEach(asset => {
        bundle.newAssetList.add(asset);
      })
      await em.flush();

      await em.commit();
    } catch (e) {
      await em.rollback();
      throw e;
    }

    return bundle.id;
  }

  async createDeploy(bundleId: number, env: EnvType) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(bundleId, 'bundleId');
    const bundle = await em.findOne(Bundle, bundleId, {
      populate: [
        'application',
        'release',
      ]
    });
    LogicException.assertNotFound(bundle, 'Bundle', bundleId);

    let status = DeployStatusType.Ready

    if (bundle.application.deployApprove) {
      // 发送审批通知
      status = DeployStatusType.Approval
    }

    const newDeploy = em.create(Deploy, {
      release: bundle.release,
      application: bundle.application,
      env,
      status,
      bundle
    });

    await em.flush();

    return newDeploy
  }

  async publish(deployId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(deployId, 'deployId');
    const deploy = await em.findOne(Deploy, deployId, {
      populate: [
        'application.devRelease',
        'application.qaRelease',
        'application.plRelease',
        'application.onlineRelease',
        'release',
        'bundle.manifest'
      ]
    });
    LogicException.assertNotFound(deploy, 'Deploy', deployId);

    if (deploy.status !== DeployStatusType.Ready) {
      throw new LogicException(`状态错误${deploy.status}`, LogicExceptionCode.UnExpect);
    }

    if (deploy.env === EnvType.Dev) {
      deploy.application.devRelease.archive = true
      deploy.application.devRelease = deploy.release
    } else if (deploy.env === EnvType.Qa) {
      deploy.application.qaRelease.archive = true
      deploy.application.qaRelease = deploy.release
    } else if (deploy.env === EnvType.Pl) {
      deploy.application.plRelease.archive = true
      deploy.application.plRelease = deploy.release
    } else if (deploy.env === EnvType.Ol) {
      deploy.application.onlineRelease.archive = true
      deploy.application.onlineRelease = deploy.release
    }

    const manifestData = JSON.parse(deploy.bundle.manifest.text)

    const newManifestData: ApplicationData = {
      ...manifestData,
      envData: {},// todo 更具环境选择不同的环境变量
    }

    const content = em.create(LargeText, {
      text: JSON.stringify(newManifestData)
    })

    const manifest = em.create(DeployManifest, {
      content,
      release: deploy.release,
      bundle: deploy.bundle,
      deploy
    });

    deploy.status = DeployStatusType.Archive

    await em.flush();

    return manifest.id;
  }

  private async createMetadata(
    instance: ComponentInstance, em: EntityManager,
    appExtScriptModuleList: ExtScriptModule[],
    solutionExtScriptModuleList: ExtScriptModule[],
    entryExtScriptModuleList: ExtScriptModule[],
    viewData: ViewData
  ) {

    const groupList = await em.find(PropGroup, { component: instance.component, componentVersion: instance.componentVersion });
    const blockList = await em.find(PropBlock, { component: instance.component, componentVersion: instance.componentVersion });
    const itemList = await em.find(PropItem, { component: instance.component, componentVersion: instance.componentVersion });
    const valueList = await em.find(PropValue, { componentInstance: instance });

    const rootGroupList = propTreeFactory(
      groupList.map(g => wrap(g).toObject()) as any as IPropGroup[],
      blockList.map(b => wrap(b).toObject()) as any as IPropBlock[],
      itemList.map(i => wrap(i).toObject()) as any as IPropItem[],
      valueList.map(v => wrap(v).toObject()) as any as IPropValue[]
    );

    const metadata = metadataFactory(rootGroupList, {
      packageName: instance.component.packageName,
      componentName: instance.component.componentName,
      metadataId: instance.id,
      rootMetadataId: instance.rootId,
      parentMetadataId: instance.parentId,
      solutionInstanceId: instance.solutionInstance.id,
      componentVersionId: instance.componentVersion.id
    }, (params) => {
      pipelineExec<PropItemPipelineParams>(entryExtScriptModuleList, solutionExtScriptModuleList, appExtScriptModuleList, {
        ...params,
        appendTask: (taskName, taskCode) => {
          params.metadata.advancedProps.push({
            keyChain: params.propKeyChain,
            type: taskName
          })
          viewData.propTaskList.push({ key: taskName, content: taskCode })
        }
      })
    });

    return metadata;
  }

  // 创建ExtScriptModule模块赋值给插件实例的propItemPipeline属性
  private installPipelineModule(
    extensionInstanceList: ExtensionInstance[],
    level: ExtensionLevel,
    extHandler: { install: (extInstance: IExtensionInstance, level: ExtensionLevel, solutionInstanceId?: number) => boolean },
    solutionInstanceId?: number
  ) {
    for (const extensionInstance of extensionInstanceList) {
      const extInstance = wrap(extensionInstance).toObject() as IExtensionInstance
      // 一定要先加载安装在初始化 module
      const success = extHandler.install(extInstance, level, solutionInstanceId)

      const extensionVersion = extensionInstance.extensionVersion

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
}



