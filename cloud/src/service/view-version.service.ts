import { ExtensionRelationType, PropMetadataData, PropValueType, ValueStruct, pick } from '@grootio/common';
import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException, LogicExceptionCode } from 'config/logic.exception';
import { ComponentInstance } from 'entities/ComponentInstance';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { PropValue } from 'entities/PropValue';
import { SolutionInstance } from 'entities/SolutionInstance';
import { ViewResource } from 'entities/ViewResource';
import { ViewVersion } from 'entities/ViewVersion';


@Injectable()
export class ViewVersionService {


  async add(rawViewVersion: ViewVersion) {
    let em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawViewVersion.imageViewVersionId, 'imageViewVersionId');
    LogicException.assertParamEmpty(rawViewVersion.name, 'name');

    const imageViewVersion = await em.findOne(ViewVersion, rawViewVersion.imageViewVersionId);
    LogicException.assertNotFound(imageViewVersion, 'ViewVersion', rawViewVersion.imageViewVersionId);
    const { app, project, view } = imageViewVersion

    const count = await em.count(ViewVersion, { view: imageViewVersion.view, name: rawViewVersion.name });
    if (count > 0) {
      throw new LogicException(`view版本名称冲突，该值必须在view范围内唯一`, LogicExceptionCode.NotUnique);
    }

    const originSolutionInstanceList = await em.find(SolutionInstance, { viewVersion: imageViewVersion })

    const originInstanceList = await em.find(ComponentInstance, { viewVersion: imageViewVersion });
    for (let originInstance of originInstanceList) {
      originInstance.valueList = await em.find(PropValue, { componentInstance: originInstance.id });
    }

    const originViewExtInstanceList = await em.find(ExtensionInstance, { relationId: imageViewVersion.id, relationType: ExtensionRelationType.View })
    const originViewResourceList = await em.find(ViewResource, { viewVersion: imageViewVersion.id })

    // 创建版本
    const newViewVersion = em.create(ViewVersion, {
      name: rawViewVersion.name,
      app,
      project,
      view
    });

    const instanceMap = new Map<number, ComponentInstance>();
    const valueMap = new Map<number, PropValue>();
    const solutionInstanceMap = new Map<number, SolutionInstance>();
    const newValueList = [];

    await em.begin();
    try {
      await em.flush();

      // 创建view级别插件实例
      for (const originViewExtInstance of originViewExtInstanceList) {
        em.create(ExtensionInstance, pick(originViewExtInstance, ['extensionVersion', 'config', 'relationType', 'extension', 'secret', 'open'], {
          relationId: newViewVersion.id
        }))
      }

      // 创建view级别资源
      for (const originViewResource of originViewResourceList) {
        em.create(ViewResource, pick(originViewResource, ['imageResource', 'name', 'value', 'namespace', 'type', 'resourceConfig',], {
          app,
          project,
          view,
          viewVersion: newViewVersion
        }))
      }

      await em.flush()

      // 创建 solutionInstance
      for (const originSolutionInstance of originSolutionInstanceList) {
        const solutionInstance = em.create(SolutionInstance, {
          ...pick(originSolutionInstance, ['solutionVersion', 'primary', 'solution']),
          viewVersion: newViewVersion,
          view,
          app,
          project,
        });
        solutionInstanceMap.set(originSolutionInstance.id, solutionInstance);
      }
      await em.flush();

      // 创建组件实例
      for (const originInstance of originInstanceList) {
        const instance = em.create(ComponentInstance, {
          ...pick(originInstance, ['component', 'componentVersion', 'trackId', 'parent', 'parserType', 'solutionComponent', 'solution']),
          solutionInstance: solutionInstanceMap.get(originInstance.solutionInstance.id),
          viewVersion: newViewVersion,
          app,
          project,
          view
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
            view,
            viewVersion: newViewVersion,
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
  }
}



