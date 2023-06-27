import {
  ApplicationData, DeployStatusType, EnvType,
  PropGroup as IPropGroup, PropBlock as IPropBlock, PropItem as IPropItem, PropValue as IPropValue, EnvTypeStr,
  ExtScriptModule, ExtensionRelationType, createExtensionHandler, ExtensionLevel, PropItemPipelineParams,
  ResourcePipelineParams, ViewData, resourceAppendTask, propAppendTask, ExtensionStatus
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
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { SolutionInstance } from 'entities/SolutionInstance';
import { LargeText } from 'entities/LargeText';
import { AppResource } from 'entities/AppResource';
import { InstanceResource } from 'entities/InstanceResource';
import { installPipelineModule, parseResource } from 'util/common';



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
      envData: [],

      resourceList: [],
      resourceConfigList: [],
      resourceTaskList: [],
    } as ApplicationData

    // 加载应用级别插件
    const appExtensionInstanceList = await em.find(ExtensionInstance, {
      relationId: releaseId,
      relationType: ExtensionRelationType.Application,
      secret: false
    }, { populate: ['extensionVersion.propItemPipelineRaw', 'extensionVersion.resourcePipelineRaw', 'extension'] })
    installPipelineModule({
      list: appExtensionInstanceList,
      level: ExtensionLevel.Application,
      extHandler
    })

    // 处理全局资源
    const appResourceExtScriptModuleList = extHandler.getPipeline('resource', ExtensionLevel.Application)
    const appResourceList = await em.find(AppResource, {
      app: application,
      release
    }, { populate: ['imageResource.resourceConfig', 'resourceConfig'] })
    const resourceConfigMap = new Map()
    appResourceList.map(resource => {
      return parseResource(resource, resourceConfigMap)
    }).forEach(resource => {

      // 运行资源管道
      pipelineExec<ResourcePipelineParams>({
        entryExtList: [], solutionExtList: [], appExtList: appResourceExtScriptModuleList,
        params: {
          resource: resource as any,
          defaultFn: () => { },
          local: false,
          appendTask: resourceAppendTask(resource as any, appData.resourceTaskList)
        }
      })

      appData.resourceList.push(resource as any)
    })
    appData.resourceConfigList = [...resourceConfigMap.values()]


    const appPropItemExtScriptModuleList = extHandler.getPipeline('propItem', ExtensionLevel.Application)
    const entryList = await em.find(ComponentInstance, { release, entry: true }, { populate: ['solutionInstance.solutionVersion', 'component'] });
    for (let entry of entryList) {
      const viewData = {
        key: entry.key,
        url: '',
        metadataList: [],
        resourceList: [],

        propTaskList: [],
        resourceTaskList: [],
        resourceConfigList: []
      } as ViewData

      // 加载实例级别插件
      const entryExtensionInstanceList = await em.find(ExtensionInstance, {
        relationId: entry.id,
        relationType: ExtensionRelationType.Entry,
        secret: false
      }, { populate: ['extensionVersion.propItemPipelineRaw', 'extensionVersion.resourcePipelineRaw', 'extension'] })
      installPipelineModule({ list: entryExtensionInstanceList, level: ExtensionLevel.Entry, extHandler })
      const entryResourceExtScriptModuleList = extHandler.getPipeline('resource', ExtensionLevel.Entry, entry.id)
      const entryPropItemExtScriptModuleList = extHandler.getPipeline('propItem', ExtensionLevel.Entry, entry.id)

      const solutionInstanceList = await em.find(SolutionInstance, {
        entry
      })

      const primarySolutionInstance = solutionInstanceList.find(item => !!item.solutionEntry)
      const noPrimarySolutionInstanceList = solutionInstanceList.filter(item => !item.solutionEntry)
      // 加载解决方案级别插件
      for (const solutionInstance of [primarySolutionInstance, ...noPrimarySolutionInstanceList]) {
        const solutionExtensionInstanceList = await em.find(ExtensionInstance, {
          relationId: solutionInstance.solutionVersion.id,
          relationType: ExtensionRelationType.Solution,
          secret: false
        }, { populate: ['extensionVersion.propItemPipelineRaw', 'extensionVersion.resourcePipelineRaw', 'extension'] })

        const solutionId = solutionInstance.solutionVersion.solution.id
        installPipelineModule({
          list: solutionExtensionInstanceList,
          level: ExtensionLevel.Solution,
          extHandler, entryId: entry.id, solutionId
        })
      }

      const solutionResourceExtScriptModuleList = extHandler.getPipeline('resource', ExtensionLevel.Solution, entry.id)

      // 处理实例资源
      const entryResourceList = await em.find(InstanceResource, {
        componentInstance: entry
      }, { populate: ['resourceConfig', 'imageResource.resourceConfig'] })
      const resourceConfigMap = new Map()
      entryResourceList.map(resource => {
        return parseResource(resource, resourceConfigMap)
      }).forEach(resource => {
        pipelineExec<ResourcePipelineParams>(
          {
            entryExtList: entryResourceExtScriptModuleList, solutionExtList: solutionResourceExtScriptModuleList, appExtList: appResourceExtScriptModuleList,
            params: {
              resource: resource as any,
              defaultFn: () => { },
              local: true,
              appendTask: resourceAppendTask(resource as any, viewData.resourceTaskList)
            }
          })

        viewData.resourceList.push(resource as any)
      })
      viewData.resourceConfigList = [...resourceConfigMap.values()]

      // 生成根实例metadata
      const solutionId = entry.solutionInstance.solutionVersion.solution.id;
      const solutionPropItemExtScriptModuleList = extHandler.getPipeline('propItem', ExtensionLevel.Solution, entry.id, solutionId)
      const entryMetadata = await this.createMetadata(entry, em, appPropItemExtScriptModuleList, solutionPropItemExtScriptModuleList, entryPropItemExtScriptModuleList, viewData);
      viewData.metadataList.push(entryMetadata);

      const childInstanceList = await em.find(ComponentInstance, { root: entry }, { populate: ['component', 'componentVersion', 'solutionInstance.solutionVersion'] });

      // 生成子实例metadata
      for (let childInstance of childInstanceList) {
        const solutionId = childInstance.solutionInstance.solutionVersion.solution.id
        const solutionPropItemExtScriptModuleList = extHandler.getPipeline('propItem', ExtensionLevel.Solution, entry.id, solutionId)

        const childMetadata = await this.createMetadata(childInstance, em, appPropItemExtScriptModuleList, solutionPropItemExtScriptModuleList, entryPropItemExtScriptModuleList, viewData);
        viewData.metadataList.push(childMetadata);
      }

      instanceToViewDataMap.set(entry, viewData);

      // 卸载解决方案级别插件
      for (const [solutionId, map] of extHandler.solutionExt.get(entry.id)) {
        for (const { instance } of map.values()) {
          extHandler.uninstall({ extInstanceId: instance.id, level: ExtensionLevel.Solution, solutionId, entryId: entry.id })
        }
      }

      // 卸载实例级别插件
      for (const { instance } of extHandler.entryExt.get(entry.id).values()) {
        extHandler.uninstall({ extInstanceId: instance.id, level: ExtensionLevel.Entry, entryId: entry.id })
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

      for (const entry of entryList) {

        const content = em.create(LargeText, {
          text: JSON.stringify(instanceToViewDataMap.get(entry))
        })

        await em.flush()

        const asset = em.create(BundleAsset, {
          content,
          entry,
          bundle,
          manifestKey: entry.key
        });

        await em.flush()

        appData.viewList.push({
          key: asset.manifestKey,
          mainEntry: entry.mainEntry,
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
      pipelineExec<PropItemPipelineParams>(
        {
          entryExtList: entryExtScriptModuleList, solutionExtList: solutionExtScriptModuleList, appExtList: appExtScriptModuleList,
          params: {
            ...params,
            appendTask: propAppendTask(params.metadata, viewData.propTaskList, params.propKeyChain)
          }
        })
    });

    return metadata;
  }

}



