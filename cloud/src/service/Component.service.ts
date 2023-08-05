import { pick, PropValueType } from '@grootio/common';
import { EntityManager, RequestContext, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { LogicException, LogicExceptionCode } from 'config/Logic.exception';
import { Component } from 'entities/Component';
import { ComponentVersion } from 'entities/ComponentVersion';
import { PropBlock } from 'entities/PropBlock';
import { PropGroup } from 'entities/PropGroup';
import { PropItem } from 'entities/PropItem';
import { PropValue } from 'entities/PropValue';
import { Solution } from 'entities/Solution';


@Injectable()
export class ComponentService {

  async getDetailByComponentVersionId(componentVersionId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(componentVersionId, 'componentVersionId');

    const version = await em.findOne(ComponentVersion, componentVersionId);
    LogicException.assertNotFound(version, 'ComponentVersion', componentVersionId);
    const componentId = version.component.id

    const component = await em.findOne(Component, componentId);
    LogicException.assertNotFound(component, 'Component', componentId);

    component.componentVersion = wrap(version).toObject() as any;

    // component.versionList = await em.find(ComponentVersion, { component });
    component.groupList = await em.find(PropGroup, { component: componentId, componentVersion: version });
    component.blockList = await em.find(PropBlock, { component: componentId, componentVersion: version });
    component.itemList = await em.find(PropItem, { component: componentId, componentVersion: version }, { populate: ['extraData'] });
    component.valueList = await em.find(PropValue, { component: componentId, componentVersion: version, type: PropValueType.Prototype });

    return component;
  }

  async add(rawComponent: Component, parentEm?: EntityManager) {
    let em = parentEm || RequestContext.getEntityManager();

    if (!rawComponent.packageName || !rawComponent.componentName) {
      throw new LogicException('参数packageName和componentName不能同时为空', LogicExceptionCode.ParamEmpty);
    }

    LogicException.assertParamEmpty(rawComponent.solutionId, 'solutionId');
    const solution = await em.findOne(Solution, rawComponent.solutionId)
    LogicException.assertNotFound(solution, 'Solution', rawComponent.solutionId);

    const sameComponentCount = await em.count(Component, {
      componentName: rawComponent.componentName,
      packageName: rawComponent.packageName,
      solution
    })


    if (sameComponentCount > 0) {
      throw new LogicException(`组件名称和包名重复`, LogicExceptionCode.NotUnique)
    }

    const newComponent = em.create(Component, pick(rawComponent, ['name', 'componentName', 'packageName'], {
      solution
    }));

    if (!parentEm) {
      await em.begin();
    }
    try {
      // 创建组件
      await em.flush();

      // 创建组件版本
      const newVersion = em.create(ComponentVersion, {
        name: 'v0.0.1',
        component: newComponent,
        solution: newComponent.solution
      });
      await em.flush();

      // em.create(SolutionComponent, {
      //   solutionVersion,
      //   componentVersion: newVersion,
      //   parent: parentComponentVersion
      // })

      // 更新组件版本
      newComponent.recentVersion = newVersion;
      await em.flush();

      // 创建默认配置组
      const newGroup = em.create(PropGroup, {
        name: '常用配置',
        order: 1000,
        componentVersion: newVersion,
        component: newComponent,
        solution: newComponent.solution
      });
      await em.flush();

      em.create(PropBlock, {
        name: '基本配置',
        group: newGroup,
        order: 1000,
        componentVersion: newVersion,
        component: newComponent,
        solution: newComponent.solution
      });
      await em.flush();

      if (!parentEm) {
        await em.commit();
      }

      newComponent.componentVersion = wrap(newVersion).toObject()
    } catch (e) {
      await em.rollback();
      throw e;
    }

    return newComponent;
  }

  public async remove(componentId: number, parentEm?: EntityManager) {
    let em = parentEm || RequestContext.getEntityManager();

    const component = await em.findOne(Component, componentId)
    LogicException.assertNotFound(component, 'Component', componentId)

    if (!parentEm) {
      await em.begin()
    }
    try {
      // todo 校验关联引用 软删除不能用nativeDelete？？？
      // await em.nativeDelete(ComponentVersion, { component }) 
      // await em.nativeDelete(PropBlock, { component })
      // await em.nativeDelete(PropGroup, { component })
      // await em.nativeDelete(PropItem, { component })
      component.deletedAt = new Date()

      await em.flush()

      if (!parentEm) {
        await em.commit()
      }
    } catch (e) {
      await em.rollback();
      throw e;
    }
  }
}



