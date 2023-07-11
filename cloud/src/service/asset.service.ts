import {
  ApplicationData, DeployStatusType, EnvType,
  PropGroup as IPropGroup, PropBlock as IPropBlock, PropItem as IPropItem, PropValue as IPropValue, EnvTypeStr,
  ExtScriptModule, ExtensionRelationType, createExtensionHandler, ExtensionLevel, PropItemPipelineParams,
  ResourcePipelineParams, ViewData, resourceAppendTask, propAppendTask
} from '@grootio/common';
import { EntityManager, RequestContext, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { propTreeFactory, metadataFactory, pipelineExec } from '@grootio/core';


import { LogicException, LogicExceptionCode } from 'config/Logic.exception';
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
import { ViewResource } from 'entities/ViewResource';
import { installPipelineModule, parseResource } from 'util/common';
import { View } from 'entities/View';



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
    const release = await em.findOne(Release, releaseId, { populate: ['app', 'project'] });
    LogicException.assertNotFound(release, 'Release', releaseId);

    const { app, project } = release

    const extHandler = createExtensionHandler();
    const viewToViewDataMap = new Map<View, ViewData>();
    const appData = {
      name: app.name,
      key: app.key,
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
      app,
      release
    }, { populate: ['imageResource.resourceConfig', 'resourceConfig'] })
    const resourceConfigMap = new Map()
    appResourceList.map(resource => {
      return parseResource(resource, resourceConfigMap)
    }).forEach(resource => {

      // 运行资源管道
      pipelineExec<ResourcePipelineParams>({
        viewExtList: [], solutionExtList: [], appExtList: appResourceExtScriptModuleList,
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
    const viewList = await em.find(View, { release });
    for (let view of viewList) {
      const viewData = {
        key: view.key,
        url: '',
        metadataList: [],
        resourceList: [],

        propTaskList: [],
        resourceTaskList: [],
        resourceConfigList: []
      } as ViewData

      // 加载实例级别插件
      const viewExtensionInstanceList = await em.find(ExtensionInstance, {
        relationId: view.id,
        relationType: ExtensionRelationType.View,
        secret: false
      }, { populate: ['extensionVersion.propItemPipelineRaw', 'extensionVersion.resourcePipelineRaw', 'extension'] })
      installPipelineModule({
        list: viewExtensionInstanceList,
        level: ExtensionLevel.View,
        extHandler, viewId: view.id
      })
      const viewResourceExtScriptModuleList = extHandler.getPipeline('resource', ExtensionLevel.View, view.id)
      const viewPropItemExtScriptModuleList = extHandler.getPipeline('propItem', ExtensionLevel.View, view.id)

      const solutionInstanceList = await em.find(SolutionInstance, { view })

      const primarySolutionInstance = solutionInstanceList.find(item => item.primary)
      const noPrimarySolutionInstanceList = solutionInstanceList.filter(item => !item.primary)
      // 加载解决方案级别插件
      for (const solutionInstance of [primarySolutionInstance, ...noPrimarySolutionInstanceList]) {
        const solutionExtensionInstanceList = await em.find(ExtensionInstance, {
          relationId: solutionInstance.solutionVersion.id,
          relationType: ExtensionRelationType.Solution,
          secret: false
        }, { populate: ['extensionVersion.propItemPipelineRaw', 'extensionVersion.resourcePipelineRaw', 'extension'] })

        const solutionId = solutionInstance.solution.id
        installPipelineModule({
          list: solutionExtensionInstanceList,
          level: ExtensionLevel.Solution,
          extHandler, viewId: view.id, solutionId
        })
      }

      const solutionResourceExtScriptModuleList = extHandler.getPipeline('resource', ExtensionLevel.Solution, view.id)

      // 处理实例资源
      const viewResourceList = await em.find(ViewResource, { view }, { populate: ['resourceConfig', 'imageResource.resourceConfig'] })
      const resourceConfigMap = new Map()
      viewResourceList.map(resource => {
        return parseResource(resource, resourceConfigMap)
      }).forEach(resource => {
        pipelineExec<ResourcePipelineParams>(
          {
            viewExtList: viewResourceExtScriptModuleList,
            solutionExtList: solutionResourceExtScriptModuleList,
            appExtList: appResourceExtScriptModuleList,
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


      const instanceList = await em.find(ComponentInstance, { view }, { populate: ['component', 'componentVersion', 'solutionInstance.solutionVersion'] });

      // 生成子实例metadata
      for (let instance of instanceList) {
        const solutionId = instance.solution.id
        const solutionPropItemExtScriptModuleList = extHandler.getPipeline('propItem', ExtensionLevel.Solution, view.id, solutionId)

        const childMetadata = await this.createMetadata(instance, em, appPropItemExtScriptModuleList, solutionPropItemExtScriptModuleList, viewPropItemExtScriptModuleList, viewData);
        viewData.metadataList.push(childMetadata);
      }

      viewToViewDataMap.set(view, viewData);

      // 卸载解决方案级别插件
      const solutionExt = extHandler.solutionExt.get(view.id)
      if (solutionExt) {
        for (const [solutionId, map] of solutionExt) {
          for (const { instance } of map.values()) {
            extHandler.uninstall({ extInstanceId: instance.id, level: ExtensionLevel.Solution, solutionId, viewId: view.id })
          }
        }
      }

      // 卸载实例级别插件
      const viewExt = extHandler.viewExt.get(view.id)
      if (viewExt) {
        for (const { instance } of viewExt.values()) {
          extHandler.uninstall({ extInstanceId: instance.id, level: ExtensionLevel.View, viewId: view.id })
        }
      }

    }

    const bundle = em.create(Bundle, {
      release,
      app,
      project
    });

    await em.begin();
    try {
      // 创建bundle
      await em.flush();

      // 创建InstanceAsset
      const newAssetList = [];

      for (const view of viewList) {

        const content = em.create(LargeText, {
          text: JSON.stringify(viewToViewDataMap.get(view))
        })

        await em.flush()

        const asset = em.create(BundleAsset, {
          content,
          view,
          bundle,
          manifestKey: view.key,
          app,
          project
        });

        await em.flush()

        appData.viewList.push({
          key: asset.manifestKey,
          primaryView: view.primaryView,
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
    const bundle = await em.findOne(Bundle, bundleId, { populate: ['app'] });
    LogicException.assertNotFound(bundle, 'Bundle', bundleId);

    let status = DeployStatusType.Ready

    if (bundle.app.deployApprove) {
      // 发送审批通知
      status = DeployStatusType.Approval
    }

    const newDeploy = em.create(Deploy, {
      release: bundle.release,
      app: bundle.app,
      project: bundle.project,
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
        'app.devRelease',
        'app.qaRelease',
        'app.plRelease',
        'app.onlineRelease',
        'release',
        'bundle.manifest'
      ]
    });
    LogicException.assertNotFound(deploy, 'Deploy', deployId);

    if (deploy.status !== DeployStatusType.Ready) {
      throw new LogicException(`状态错误${deploy.status}`, LogicExceptionCode.UnExpect);
    }

    if (deploy.env === EnvType.Dev) {
      deploy.app.devRelease.archive = true
      deploy.app.devRelease = deploy.release
    } else if (deploy.env === EnvType.Qa) {
      deploy.app.qaRelease.archive = true
      deploy.app.qaRelease = deploy.release
    } else if (deploy.env === EnvType.Pl) {
      deploy.app.plRelease.archive = true
      deploy.app.plRelease = deploy.release
    } else if (deploy.env === EnvType.Ol) {
      deploy.app.onlineRelease.archive = true
      deploy.app.onlineRelease = deploy.release
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
      deploy,
      app: deploy.app,
      project: deploy.project
    });

    deploy.status = DeployStatusType.Archive

    await em.flush();

    return manifest.id;
  }

  private async createMetadata(
    instance: ComponentInstance, em: EntityManager,
    appExtScriptModuleList: ExtScriptModule[],
    solutionExtScriptModuleList: ExtScriptModule[],
    viewExtScriptModuleList: ExtScriptModule[],
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
      viewId: instance.view.id,
      parentMetadataId: instance.parentId,
      solutionInstanceId: instance.solutionInstance.id,
      componentVersionId: instance.componentVersion.id,
      solutionComponentId: instance.solutionComponent.id
    }, (params) => {
      pipelineExec<PropItemPipelineParams>(
        {
          viewExtList: viewExtScriptModuleList, solutionExtList: solutionExtScriptModuleList, appExtList: appExtScriptModuleList,
          params: {
            ...params,
            appendTask: propAppendTask(params.metadata, viewData.propTaskList, params.propKeyChain)
          }
        })
    });

    return metadata;
  }

}



