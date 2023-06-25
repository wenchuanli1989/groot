import { pick, PropValueType } from '@grootio/common';
import { RequestContext, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { LogicException, LogicExceptionCode } from 'config/logic.exception';
import { Component } from 'entities/Component';
import { ComponentVersion } from 'entities/ComponentVersion';
import { PropBlock } from 'entities/PropBlock';
import { PropGroup } from 'entities/PropGroup';
import { PropItem } from 'entities/PropItem';
import { PropValue } from 'entities/PropValue';
import { SolutionVersion } from 'entities/SolutionVersion';


@Injectable()
export class ComponentService {

  async getComponentDetailByVersionId(versionId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(versionId, 'versionId');

    const version = await em.findOne(ComponentVersion, versionId);
    LogicException.assertNotFound(version, 'ComponentVersion', versionId);
    const componentId = version.component.id

    const component = await em.findOne(Component, componentId);
    LogicException.assertNotFound(component, 'Component', componentId);

    component.componentVersion = wrap(version).toObject() as any;

    // component.versionList = await em.find(ComponentVersion, { component });
    component.groupList = await em.find(PropGroup, { component: componentId, componentVersion: version });
    component.blockList = await em.find(PropBlock, { component: componentId, componentVersion: version });
    component.itemList = await em.find(PropItem, { component: componentId, componentVersion: version });
    component.valueList = await em.find(PropValue, { component: componentId, componentVersion: version, type: PropValueType.Prototype });

    return component;
  }

  async add(rawComponent: Component) {
    const em = RequestContext.getEntityManager();

    if (!rawComponent.packageName || !rawComponent.componentName) {
      throw new LogicException('参数packageName和componentName不能同时为空', LogicExceptionCode.ParamEmpty);
    }

    LogicException.assertParamEmpty(rawComponent.solutionVersionId, 'solutionVersionId');
    const solutionVersion = await em.findOne(SolutionVersion, rawComponent.solutionVersionId)
    LogicException.assertNotFound(solutionVersion, 'SolutionVersion', rawComponent.solutionVersionId);

    const newComponent = em.create(Component, pick(rawComponent, ['name', 'componentName', 'packageName']));

    await em.begin();
    try {
      // 创建组件
      await em.flush();

      // 创建组件版本
      const newVersion = em.create(ComponentVersion, {
        name: 'v0.0.1',
        component: newComponent,
      });
      await em.flush();

      // 更新组件版本
      newComponent.recentVersion = newVersion;
      await em.flush();

      solutionVersion.componentVersionList.add(newVersion)

      // 创建默认配置组
      const newGroup = em.create(PropGroup, {
        name: '常用配置',
        order: 1000,
        componentVersion: newVersion,
        component: newComponent
      });
      await em.flush();

      em.create(PropBlock, {
        name: '基本配置',
        group: newGroup,
        order: 1000,
        componentVersion: newVersion,
        component: newComponent
      });
      await em.flush();

      await em.commit();

      newComponent.componentVersion = wrap(newVersion).toObject()
    } catch (e) {
      await em.rollback();
      throw e;
    }

    return newComponent;
  }


}



