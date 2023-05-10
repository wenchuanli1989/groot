import {
  ApplicationData, DeployStatusType, EnvType, Metadata,
  PropGroup as IPropGroup, PropBlock as IPropBlock, PropItem as IPropItem, PropValue as IPropValue, EnvTypeStr,
  ExtScriptModule, ExtensionRelationType, createExtensionHandler, ExtensionLevel, ExtensionInstance as IExtensionInstance
} from '@grootio/common';
import { EntityManager, RequestContext, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { propTreeFactory, metadataFactory, propItemPipeline } from '@grootio/core';


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
import { Resource } from 'entities/Resource';


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

    LogicException.assertParamEmpty(releaseId, 'releaseId');
    const release = await em.findOne(Release, releaseId);
    LogicException.assertNotFound(release, 'Release', releaseId);

    const application = await em.findOne(Application, release.application.id);

    const extHandler = createExtensionHandler();

    const releaseExtensionInstanceList = await em.find(ExtensionInstance, {
      relationId: releaseId,
      relationType: ExtensionRelationType.Release,
    }, { populate: ['extensionVersion.propItemPipelineRaw', 'extension'] })

    this.installPropItemPipelineModule(releaseExtensionInstanceList, ExtensionLevel.Application, extHandler)
    const releaseExtScriptModuleList = [...extHandler.application.values()].filter(item => !!item.propItemPipeline).map(item => item.propItemPipeline)

    const rootInstanceList = await em.find(ComponentInstance, { release, root: null }, { populate: ['solutionInstance', 'component'] });
    const instanceMetadataMap = new Map<ComponentInstance, Metadata[]>();
    // 生成metadata
    for (let rootInstance of rootInstanceList) {
      const metadataList = [];

      const solutionInstanceList = await em.find(SolutionInstance, {
        entry: rootInstance
      })

      for (const solutionInstance of solutionInstanceList) {
        const solutionExtensionInstanceList = await em.find(ExtensionInstance, {
          relationId: solutionInstance.solutionVersion.id,
          relationType: ExtensionRelationType.SolutionVersion
        }, { populate: ['extensionVersion.propItemPipelineRaw', 'extension'] })

        this.installPropItemPipelineModule(solutionExtensionInstanceList, ExtensionLevel.Solution, extHandler, solutionInstance.id)
      }

      const entryExtensionInstanceList = await em.find(ExtensionInstance, {
        relationId: rootInstance.id,
        relationType: ExtensionRelationType.Entry
      }, { populate: ['extensionVersion.propItemPipelineRaw', 'extension'] })

      this.installPropItemPipelineModule(entryExtensionInstanceList, ExtensionLevel.Entry, extHandler)
      const entryExtScriptModuleList = [...extHandler.entry.values()].filter(item => !!item.propItemPipeline).map(item => item.propItemPipeline)

      const solutionExtScriptModuleList = [...(extHandler.solution.get(rootInstance.solutionInstance.id)?.values() || [])].filter(item => !!item.propItemPipeline).map(item => item.propItemPipeline)
      const rootMetadata = await this.createMetadata(rootInstance, em, releaseExtScriptModuleList, solutionExtScriptModuleList, entryExtScriptModuleList);
      metadataList.push(rootMetadata);
      const childInstanceList = await em.find(ComponentInstance, { root: rootInstance }, { populate: ['component', 'componentVersion', 'solutionInstance'] });

      for (let childInstance of childInstanceList) {
        const solutionExtScriptModuleList = [...(extHandler.solution.get(childInstance.solutionInstance.id)?.values() || [])].filter(item => !!item.propItemPipeline).map(item => item.propItemPipeline)

        const childMetadata = await this.createMetadata(childInstance, em, releaseExtScriptModuleList, solutionExtScriptModuleList, entryExtScriptModuleList);
        metadataList.push(childMetadata);
      }

      instanceMetadataMap.set(rootInstance, metadataList);

      for (const extInstance of extHandler.entry.values()) {
        extHandler.uninstall(extInstance.id, ExtensionLevel.Entry)
      }

      for (const [solutionInstanceId, map] of extHandler.solution) {
        for (const extInstance of map.values()) {
          extHandler.uninstall(extInstance.id, ExtensionLevel.Solution, solutionInstanceId)
        }
      }
    }

    const manifest = {
      metadataList: [],
      resourceList: []
    }

    manifest.resourceList = await em.find(Resource, { release, componentInstance: null })

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
        const resourceList = await em.find(Resource, { componentInstance: instance })
        const metadataList = instanceMetadataMap.get(instance);

        const content = em.create(LargeText, {
          text: JSON.stringify({ metadataList, resourceList })
        })

        await em.flush()

        const asset = em.create(BundleAsset, {
          content,
          entry: instance,
          bundle,
          manifestKey: instance.key
        });

        await em.flush()

        manifest.metadataList.push({
          key: asset.manifestKey,
          metadataUrl: `http://groot-local.com:10000/asset/instance/${asset.id}`
        })
        newAssetList.push(asset);
      }

      const manifestLargeText = em.create(LargeText, {
        text: JSON.stringify(manifest)
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

    const { metadataList, resourceList } = JSON.parse(deploy.bundle.manifest.text)

    const appData: ApplicationData = {
      name: deploy.application.name,
      key: deploy.application.key,
      viewList: metadataList,
      envData: {},
      resourceList
    }

    const content = em.create(LargeText, {
      text: JSON.stringify(appData)
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
    releaseExtScriptModuleList: ExtScriptModule[],
    solutionExtScriptModuleList: ExtScriptModule[],
    entryExtScriptModuleList: ExtScriptModule[],
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
      propItemPipeline(entryExtScriptModuleList, solutionExtScriptModuleList, releaseExtScriptModuleList, params)
    });

    return metadata;
  }

  private installPropItemPipelineModule(
    extensionInstanceList: ExtensionInstance[],
    level: ExtensionLevel,
    extHandler: { install: (extInstance: IExtensionInstance, level: ExtensionLevel, solutionInstanceId?: number) => boolean },
    solutionInstanceId?: number
  ) {
    for (const extensionInstance of extensionInstanceList) {
      const extInstance = wrap(extensionInstance).toObject() as IExtensionInstance

      const success = extHandler.install(extInstance, level, solutionInstanceId)
      if (success && extensionInstance.extensionVersion.propItemPipelineRaw?.text) {
        const code = extensionInstance.extensionVersion.propItemPipelineRaw.text
        const module = vm2.run(code) as ExtScriptModule
        module.id = extInstance.id;
        extInstance.propItemPipeline = module
      }
    }
  }
}



