import { pick, PropValueType } from '@grootio/common';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { LogicException, LogicExceptionCode } from 'config/Logic.exception';
import { ComponentInstance } from 'entities/ComponentInstance';
import { PropBlock } from 'entities/PropBlock';
import { PropGroup } from 'entities/PropGroup';
import { PropItem } from 'entities/PropItem';
import { PropValue } from 'entities/PropValue';
import { SolutionInstance } from 'entities/SolutionInstance';
import { SolutionComponent } from 'entities/SolutionComponent';

@Injectable()
export class ComponentInstanceService {

  async add(rawInstance: Partial<ComponentInstance>, parentEm?: EntityManager) {
    let em = parentEm || RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawInstance.solutionComponentId, 'solutionComponentId')
    LogicException.assertParamEmpty(rawInstance.solutionInstanceId, 'solutionInstanceId')
    const solutionInstance = await em.findOne(SolutionInstance, rawInstance.solutionInstanceId)
    LogicException.assertNotFound(solutionInstance, 'SolutionInstance', rawInstance.solutionInstanceId);

    const solutionComponent = await em.findOne(SolutionComponent, {
      solutionVersion: solutionInstance.solutionVersion, id: rawInstance.solutionComponentId
    }, { populate: ['componentVersion.component'] })
    LogicException.assertNotFound(solutionComponent, 'SolutionComponent', rawInstance.solutionComponentId);

    const { componentVersion, solution } = solutionComponent
    const { app, project, view, viewVersion } = solutionInstance

    const valueMap = new Map<number, PropValue>();
    const newValueList = [];

    const prototypeValueList = await em.find(PropValue, {
      component: componentVersion.component,
      componentVersion,
      type: PropValueType.Prototype
    });

    const newInstance = em.create(ComponentInstance, {
      parent: rawInstance.parentId,
      view,
      viewVersion,
      component: componentVersion.component,
      componentVersion,
      trackId: 0,
      solutionInstance,
      solutionComponent,
      solution,
      app,
      project
    });

    let parentCtx = parentEm ? em.getTransactionContext() : undefined;
    await em.begin();
    try {
      // 创建组件实例
      await em.flush();
      // 更新trackId，方便多版本迭代之间跟踪组件实例
      newInstance.trackId = newInstance.id;

      // 创建组件值列表
      prototypeValueList.forEach(propValue => {
        const newPropValue = em.create(PropValue, {
          ...pick(propValue, [
            'propItem', 'value', 'abstractValueIdChain',
            'component', 'componentVersion', 'order', 'valueStruct', 'solution'
          ]),
          componentInstance: newInstance,
          type: PropValueType.Instance,
          view,
          viewVersion,
          app,
          project
        });
        newValueList.push(newPropValue);
        valueMap.set(propValue.id, newPropValue);
      });
      await em.flush();

      // 更新组件值的abstractValueIdChain
      newValueList.forEach(newPropValue => {
        const abstractValueIdChain = (newPropValue.abstractValueIdChain || '').split(',').filter(id => !!id).map(valueId => {
          const oldPropValue = valueMap.get(+valueId);
          if (!oldPropValue) {
            throw new LogicException(`找不到对应的propValue，id: ${valueId}`, LogicExceptionCode.UnExpect);
          }
          return oldPropValue.id;
        }).join(',');

        newPropValue.abstractValueIdChain = abstractValueIdChain;
      });
      await em.flush();

      await em.commit();
    } catch (e) {
      await em.rollback();
      throw e;
    } finally {
      if (parentCtx) {
        em.setTransactionContext(parentCtx);
      }
    }

    return newInstance;
  }

  // async reverseDetectId(trackId: number, releaseId: number) {
  //   const em = RequestContext.getEntityManager();

  //   LogicException.assertParamEmpty(trackId, 'trackId');
  //   LogicException.assertParamEmpty(releaseId, 'releaseId');
  //   const instance = await em.findOne(ComponentInstance, { trackId, release: releaseId });

  //   return instance?.id;
  // }

  async addChild(rawInstance: ComponentInstance) {
    const em = RequestContext.getEntityManager();

    // await em.begin();
    // try {

    const newInstance = await this.add(rawInstance, em);

    // await em.commit();

    newInstance.groupList = await em.find(PropGroup, { component: newInstance.component, componentVersion: newInstance.componentVersion });
    newInstance.blockList = await em.find(PropBlock, { component: newInstance.component, componentVersion: newInstance.componentVersion });
    newInstance.itemList = await em.find(PropItem, { component: newInstance.component, componentVersion: newInstance.componentVersion });
    newInstance.valueList = await em.find(PropValue, { componentInstance: newInstance });

    return newInstance;
    // } catch (e) {
    //   await em.rollback();
    //   throw e;
    // }

  }

  async remove(id: number, em = RequestContext.getEntityManager()) {
    let removeIds = [id];

    const instance = await em.findOne(ComponentInstance, id);

    LogicException.assertNotFound(instance, 'ComponentInstance', id);

    let parentIds = [id];
    do {
      const instance = await em.findOne(ComponentInstance, parentIds.shift());
      const childList = await em.find(ComponentInstance, { parent: instance.id });
      childList.forEach((child) => {
        removeIds.push(child.id);
        parentIds.push(child.id);
      })
    } while (parentIds.length);

    await em.nativeUpdate(ComponentInstance, { id: { $in: removeIds } }, { deletedAt: new Date() });
  }

}



