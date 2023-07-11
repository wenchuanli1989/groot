import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { PropMetadataData, pick, PropValueType, ValueStruct, ExtensionRelationType } from '@grootio/common';

import { LogicException, LogicExceptionCode } from 'config/Logic.exception';
import { Release } from 'entities/Release';
import { ComponentInstanceService } from './component-instance.service';
import { PropValueService } from './prop-value.service';
import { ComponentInstance } from 'entities/ComponentInstance';
import { PropValue } from 'entities/PropValue';
import { View } from 'entities/View';
import { SolutionInstance } from 'entities/SolutionInstance';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { AppResource } from 'entities/AppResource';
import { ViewResource } from 'entities/ViewResource';


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

    const imageRelease = await em.findOne(Release, rawRelease.imageReleaseId, { populate: ['app', 'project'] });
    LogicException.assertNotFound(imageRelease, 'Release', rawRelease.imageReleaseId);
    const { app, project } = imageRelease

    const count = await em.count(Release, { app, name: rawRelease.name });
    if (count > 0) {
      throw new LogicException(`迭代版本名称冲突，该值必须在应用范围内唯一`, LogicExceptionCode.NotUnique);
    }

    const originSolutionInstanceList = await em.find(SolutionInstance, { release: imageRelease })
    const originViewList = await em.find(View, { release: imageRelease })
    const originAppExtInstanceList = await em.find(ExtensionInstance, { relationId: rawRelease.imageReleaseId, relationType: ExtensionRelationType.Application })
    const originAppResourceList = await em.find(AppResource, { release: imageRelease })
    const originCoreExtInstance = await em.findOne(ExtensionInstance, { relationId: imageRelease.id, relationType: ExtensionRelationType.Application, secret: true });

    const originInstanceList = await em.find(ComponentInstance, { release: imageRelease });
    for (let originInstance of originInstanceList) {
      originInstance.valueList = await em.find(PropValue, { componentInstance: originInstance.id });
    }

    // 创建迭代版本
    const newRelease = em.create(Release, {
      name: rawRelease.name,
      app,
      project,
      playgroundPath: rawRelease.playgroundPath || app.playgroundPath,
      debugBaseUrl: rawRelease.debugBaseUrl || app.debugBaseUrl
    });

    const instanceMap = new Map<number, ComponentInstance>();
    const viewMap = new Map<number, View>();
    const valueMap = new Map<number, PropValue>();
    const solutionInstanceMap = new Map<number, SolutionInstance>();
    const newValueList = [];

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

      // 创建view
      for (const originView of originViewList) {
        const view = em.create(View, {
          ...pick(originView, ['key', 'name', 'primaryView']),
          app,
          project,
          release: newRelease,
        });
        viewMap.set(originView.id, view);
      }
      await em.flush();

      // 创建view级别插件实例
      for (const originView of originViewList) {
        const originViewExtInstanceList = await em.find(ExtensionInstance, { relationId: originView.id, relationType: ExtensionRelationType.View })
        for (const originViewExtInstance of originViewExtInstanceList) {
          em.create(ExtensionInstance, pick(originViewExtInstance, ['extensionVersion', 'config', 'relationType', 'extension', 'secret', 'open'], {
            relationId: viewMap.get(originView.id).id
          }))
        }
      }

      // 创建view级别资源
      for (const originView of originViewList) {
        const originViewResourceList = await em.find(ViewResource, { view: originView })
        for (const originViewResource of originViewResourceList) {
          em.create(ViewResource, pick(originViewResource, ['release', 'imageResource', 'app', 'name', 'value', 'namespace', 'type', 'resourceConfig', 'project'], {
            view: viewMap.get(originView.id)
          }))
        }
      }

      await em.flush()

      // 创建 solutionInstance
      for (const originSolutionInstance of originSolutionInstanceList) {
        const solutionInstance = em.create(SolutionInstance, {
          ...pick(originSolutionInstance, ['solutionVersion', 'primary', 'solution']),
          view: viewMap.get(originSolutionInstance.view.id),
          app,
          project,
          release: newRelease,
        });
        solutionInstanceMap.set(originSolutionInstance.id, solutionInstance);
      }
      await em.flush();

      // 创建组件实例
      for (const originInstance of originInstanceList) {
        const instance = em.create(ComponentInstance, {
          ...pick(originInstance, ['component', 'componentVersion', 'trackId', 'parent', 'parserType', 'solutionComponent', 'solution']),
          solutionInstance: solutionInstanceMap.get(originInstance.solutionInstance.id),
          release: newRelease,
          app,
          project,
          view: viewMap.get(originInstance.view.id)
        });
        instanceMap.set(originInstance.id, instance);
      }
      await em.flush();

      for (const originInstance of originInstanceList) {
        const newInstance = instanceMap.get(originInstance.id);
        // 构建子父级关系
        if (originInstance.parent) {
          newInstance.parent = instanceMap.get(originInstance.parent.id);
        }

        // 创建组件值列表
        originInstance.valueList.forEach((originPropValue) => {
          const newPropValue = em.create(PropValue, {
            ...pick(originPropValue, [
              'propItem', 'value', 'abstractValueIdChain',
              'component', 'componentVersion', 'order', 'valueStruct'
            ]),
            type: PropValueType.Instance,
            view: newInstance.view,
            componentInstance: newInstance,
            solution: newInstance.solution,
            app,
            project
          });
          valueMap.set(originPropValue.id, newPropValue);
          newValueList.push(newPropValue);
        })
      }
      await em.flush();

      // 更新属性值
      for (const newPropValue of newValueList) {
        const abstractValueIdChain = (newPropValue.abstractValueIdChain || '').split(',').filter(id => !!id).map(originValueId => {
          const propValue = valueMap.get(+originValueId);
          if (!propValue) {
            throw new LogicException(`找不到对应的propValue，id: ${originValueId}`, LogicExceptionCode.UnExpect);
          }
          return propValue.id;
        }).join(',');

        newPropValue.abstractValueIdChain = abstractValueIdChain;

        if (newPropValue.valueStruct === ValueStruct.ChildComponentList) {
          const componentValue = JSON.parse(newPropValue.value) as PropMetadataData;
          componentValue.list.forEach(data => {
            data.instanceId = instanceMap.get(data.instanceId).id;
          });
          newPropValue.value = JSON.stringify(componentValue);
        }

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



