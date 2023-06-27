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
import { SolutionComponent } from 'entities/SolutionComponent';
import { SolutionVersion } from 'entities/SolutionVersion';


@Injectable()
export class ComponentService {

  async componentDetailByComponentVersionId(componentVersionId: number, solutionVersionId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(componentVersionId, 'componentVersionId');
    LogicException.assertParamEmpty(solutionVersionId, 'solutionVersionId');

    const solutionVersion = await em.findOne(SolutionVersion, solutionVersionId);
    LogicException.assertNotFound(solutionVersion, 'SolutionVersion', solutionVersionId);

    const hitSolutionComponent = await em.findOne(SolutionComponent, { solutionVersion: solutionVersionId, componentVersion: componentVersionId })
    if (!hitSolutionComponent) {
      throw new LogicException(`组件{componentVersionId: ${componentVersionId}} 不在解决方案中`, LogicExceptionCode.UnExpect)
    }

    const version = await em.findOne(ComponentVersion, componentVersionId);
    LogicException.assertNotFound(version, 'ComponentVersion', componentVersionId);
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

      em.create(SolutionComponent, {
        solutionVersion,
        componentVersion: newVersion
      })

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



