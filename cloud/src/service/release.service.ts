import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { pick, ExtensionRelationType } from '@grootio/common';

import { LogicException, LogicExceptionCode } from 'config/Logic.exception';
import { Release } from 'entities/Release';
import { ComponentInstanceService } from './component-instance.service';
import { PropValueService } from './prop-value.service';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { AppResource } from 'entities/AppResource';
import { AppView } from 'entities/AppView';


@Injectable()
export class ReleaseService {

  constructor(
    public componentInstanceService: ComponentInstanceService,
    public propValueService: PropValueService,
  ) { }

  async add(rawRelease: Release) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawRelease.imageReleaseId, 'imageReleaseId');
    LogicException.assertParamEmpty(rawRelease.name, 'name');

    const imageRelease = await em.findOne(Release, rawRelease.imageReleaseId);
    LogicException.assertNotFound(imageRelease, 'Release', rawRelease.imageReleaseId);
    const { app, project } = imageRelease

    const count = await em.count(Release, { app, name: rawRelease.name });
    if (count > 0) {
      throw new LogicException(`迭代版本名称冲突，该值必须在应用范围内唯一`, LogicExceptionCode.NotUnique);
    }

    const originAppViewList = await em.find(AppView, { app: imageRelease.app })
    const originAppExtInstanceList = await em.find(ExtensionInstance, { relationId: rawRelease.imageReleaseId, relationType: ExtensionRelationType.Application })
    const originAppResourceList = await em.find(AppResource, { release: imageRelease })
    const originCoreExtInstance = await em.findOne(ExtensionInstance, { relationId: imageRelease.id, relationType: ExtensionRelationType.Application, secret: true });


    // 创建迭代版本
    const newRelease = em.create(Release, {
      name: rawRelease.name,
      app,
      project,
      playgroundPath: rawRelease.playgroundPath || app.playgroundPath,
      debugBaseUrl: rawRelease.debugBaseUrl || app.debugBaseUrl
    });

    const appViewMap = new Map<number, AppView>();

    await em.begin();
    try {

      await em.flush();

      // 创建应用级别插件实例
      for (const originAppExtInstance of originAppExtInstanceList) {
        em.create(ExtensionInstance, pick(originAppExtInstance, ['extensionVersion', 'config', 'relationType', 'extension', 'secret', 'open'], {
          relationId: newRelease.id
        }))
      }

      em.create(ExtensionInstance, pick(originCoreExtInstance, ['extensionVersion', 'config', 'relationType', 'extension', 'secret', 'open'], {
        relationId: newRelease.id,
        secret: true
      }))

      // 创建应用级别资源
      for (const originAppResource of originAppResourceList) {
        em.create(AppResource, pick(originAppResource, ['imageResource', 'app', 'name', 'value', 'namespace', 'type', 'resourceConfig', 'project'], {
          release: newRelease
        }))
      }

      // 创建appView
      for (const originAppView of originAppViewList) {
        const appView = em.create(AppView, {
          ...pick(originAppView, ['view', 'viewVersion', 'primaryView']),
          app,
          project,
          release: newRelease,
        });
        appViewMap.set(originAppView.id, appView);
      }
      await em.flush();

      await em.commit();
    } catch (e) {
      await em.rollback();
      throw e;
    }

    return newRelease;
  }

  async list(appId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(appId, 'appId');

    const list = await em.find(Release, { app: appId })

    return list
  }

}



