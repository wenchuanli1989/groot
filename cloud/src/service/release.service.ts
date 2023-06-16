import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { PropMetadataComponent, pick, PropValueType, ValueStruct } from '@grootio/common';

import { LogicException, LogicExceptionCode } from 'config/logic.exception';
import { Release } from 'entities/Release';
import { ComponentInstanceService } from './component-instance.service';
import { PropValueService } from './prop-value.service';
import { ComponentInstance } from 'entities/ComponentInstance';
import { PropValue } from 'entities/PropValue';


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

    const imageRelease = await em.findOne(Release, rawRelease.imageReleaseId, { populate: ['application'] });
    LogicException.assertNotFound(imageRelease, 'Release', rawRelease.imageReleaseId);

    const count = await em.count(Release, { application: imageRelease.application, name: rawRelease.name });
    if (count > 0) {
      throw new LogicException(`迭代版本名称冲突，该值必须在应用范围内唯一`, LogicExceptionCode.NotUnique);
    }

    const originInstanceList = await em.find(ComponentInstance, { release: imageRelease });
    for (let index = 0; index < originInstanceList.length; index++) {
      const originInstance = originInstanceList[index];
      originInstance.valueList = await em.find(PropValue, { componentInstance: originInstance.id });
    }

    const newRelease = em.create(Release, {
      name: rawRelease.name,
      application: imageRelease.application,
      playgroundPath: rawRelease.playgroundPath || imageRelease.application.playgroundPath,
      debugBaseUrl: rawRelease.debugBaseUrl || imageRelease.application.debugBaseUrl
    });

    const instanceMap = new Map<number, ComponentInstance>();
    const valueMap = new Map<number, PropValue>();
    const newValueList = [];

    await em.begin();
    try {
      // 创建迭代版本
      await em.flush();

      // 创建组件实例
      originInstanceList.forEach((originInstance) => {
        const instance = em.create(ComponentInstance, {
          ...pick(originInstance, ['key', 'name', 'component', 'componentVersion', 'trackId', 'entry', 'mainEntry', 'solutionInstance']),
          release: newRelease,
        });
        instanceMap.set(originInstance.id, instance);
      })
      await em.flush();

      originInstanceList.forEach((originInstance) => {
        const instance = instanceMap.get(originInstance.id);
        // 构建子父级关系
        if (originInstance.parent) {
          instance.parent = instanceMap.get(originInstance.parent.id);
        }

        if (originInstance.root) {
          instance.root = instanceMap.get(originInstance.root.id);
        }

        // 创建组件值列表
        originInstance.valueList.forEach((originPropValue) => {
          const newPropValue = em.create(PropValue, {
            ...pick(originPropValue, [
              'propItem', 'value', 'abstractValueIdChain',
              'component', 'componentVersion', 'order', 'valueStruct'
            ]),
            type: PropValueType.Instance,
            componentInstance: instance
          });
          valueMap.set(originPropValue.id, newPropValue);
          newValueList.push(newPropValue);
        })
      })
      await em.flush();

      // 更新组件值的abstractValueIdChain
      newValueList.forEach((newPropValue) => {
        const abstractValueIdChain = (newPropValue.abstractValueIdChain || '').split(',').filter(id => !!id).map(valueId => {
          const oldPropValue = valueMap.get(+valueId);
          if (!oldPropValue) {
            throw new LogicException(`找不到对应的propValue，id: ${valueId}`, LogicExceptionCode.UnExpect);
          }
          return oldPropValue.id;
        }).join(',');

        if (newPropValue.valueStruct === ValueStruct.ChildComponentList) {
          const componentValue = JSON.parse(newPropValue.value) as PropMetadataComponent;
          componentValue.list.forEach(data => {
            data.instanceId = instanceMap.get(data.instanceId).id;
          });
          newPropValue.value = JSON.stringify(componentValue);
        }

        newPropValue.abstractValueIdChain = abstractValueIdChain;
      });
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

    const list = await em.find(Release, { application: appId })

    return list
  }

}



