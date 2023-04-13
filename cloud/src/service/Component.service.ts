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
import { Solution } from 'entities/Solution';
import { SolutionVersion } from 'entities/SolutionVersion';


@Injectable()
export class ComponentService {

  /**
   * 获取组件某个版本的配置信息
   * @param id 组件ID
   * @param versionId 组件版本
   * @returns 组件信息
   */
  async getComponentPrototype(id: number, versionId?: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(id, 'id');
    const component = await em.findOne(Component, id);
    LogicException.assertNotFound(component, 'Component', id);

    const version = await em.findOne(ComponentVersion, versionId || component.recentVersion.id);
    LogicException.assertNotFound(version, 'ComponentVersion', versionId);
    component.componentVersion = wrap(version).toObject() as any;

    // component.versionList = await em.find(ComponentVersion, { component });
    component.groupList = await em.find(PropGroup, { component: id, componentVersion: version });
    component.blockList = await em.find(PropBlock, { component: id, componentVersion: version });
    component.itemList = await em.find(PropItem, { component: id, componentVersion: version });
    component.valueList = await em.find(PropValue, { component: id, componentVersion: version, type: PropValueType.Prototype });

    return component;
  }

  async add(rawComponent: Component) {
    const em = RequestContext.getEntityManager();

    if (!rawComponent.packageName || !rawComponent.componentName) {
      throw new LogicException('参数packageName和componentName不能同时为空', LogicExceptionCode.ParamEmpty);
    }
    LogicException.assertParamEmpty(rawComponent.solutionId, 'solutionId');

    const solution = await em.findOne(Solution, rawComponent.solutionId);
    LogicException.assertNotFound(solution, 'Solution', rawComponent.solutionId);

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
    } catch (e) {
      await em.rollback();
      throw e;
    }

    return newComponent;
  }


}



