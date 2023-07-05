import { PropValueType } from '@grootio/common';
import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { LogicException } from 'config/Logic.exception';
import { PropItem } from 'entities/PropItem';
import { PropValue } from 'entities/PropValue';


@Injectable()
export class PropValueService {
  async abstractTypeAdd(rawPropValue: PropValue) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawPropValue.type, 'type');
    LogicException.assertParamEmpty(rawPropValue.propItemId, 'propItemId');
    LogicException.assertParamEmpty(rawPropValue.componentId, 'componentId');
    LogicException.assertParamEmpty(rawPropValue.componentVersionId, 'componentVersionId');
    const query = {
      propItem: rawPropValue.propItemId,
      abstractValueIdChain: rawPropValue.abstractValueIdChain,
      component: rawPropValue.componentId,
      componentVersion: rawPropValue.componentVersionId,
      type: rawPropValue.type,
    } as any;
    if (rawPropValue.type === PropValueType.Instance) {
      LogicException.assertParamEmpty(rawPropValue.componentInstanceId, 'componentInstanceId');
      LogicException.assertParamEmpty(rawPropValue.viewId, 'viewId');
      LogicException.assertParamEmpty(rawPropValue.appId, 'appId');
      LogicException.assertParamEmpty(rawPropValue.projectId, 'projectId');
      LogicException.assertParamEmpty(rawPropValue.solutionId, 'solutionId');

      query.componentInstance = rawPropValue.componentInstanceId;
      query.view = rawPropValue.viewId;
      query.app = rawPropValue.appId;
      query.project = rawPropValue.projectId;
      query.solution = rawPropValue.solutionId;
    } else {
      LogicException.assertParamEmpty(rawPropValue.solutionId, 'solutionId');

      query.solution = rawPropValue.solutionId;
    }

    const lastPropValue = await em.findOne(PropValue, query, { orderBy: { order: 'DESC' } });
    const newPropValue = em.create(PropValue, {
      ...query,
      order: (lastPropValue?.order || 0) + 1000
    });

    await em.flush();

    return newPropValue;
  }

  async abstractTypeRemove(propValueId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(propValueId, 'propValueId');
    const propValue = await em.findOne(PropValue, propValueId);

    await em.begin();
    try {
      await em.nativeUpdate(PropValue, {
        abstractValueIdChain: { $like: `${propValue.id}` },
        component: propValue.componentId,
        componentVersion: propValue.componentVersionId,
      }, { deletedAt: new Date() });
      propValue.deletedAt = new Date()

      await em.commit();
    } catch (e) {
      await em.rollback();
      throw e;
    }

  }

  async update(rawPropValue: PropValue) {
    const em = RequestContext.getEntityManager();

    if (rawPropValue.id) {
      const propValue = await em.findOne(PropValue, rawPropValue.id);
      LogicException.assertNotFound(propValue, 'PropValue', rawPropValue.id);

      propValue.value = rawPropValue.value;
      await em.flush();
      return null;
    } else if (rawPropValue.type === PropValueType.Instance) {
      LogicException.assertParamEmpty(rawPropValue.propItemId, 'propItemId');
      LogicException.assertParamEmpty(rawPropValue.componentId, 'componentId');
      LogicException.assertParamEmpty(rawPropValue.componentVersionId, 'componentVersionId');
      LogicException.assertParamEmpty(rawPropValue.componentInstanceId, 'componentInstanceId');
      LogicException.assertParamEmpty(rawPropValue.viewId, 'viewId');
      LogicException.assertParamEmpty(rawPropValue.appId, 'appId');
      LogicException.assertParamEmpty(rawPropValue.projectId, 'projectId');
      LogicException.assertParamEmpty(rawPropValue.solutionId, 'solutionId');

      const newPropValue = em.create(PropValue, {
        propItem: rawPropValue.propItemId,
        component: rawPropValue.componentId,
        componentVersion: rawPropValue.componentVersionId,
        value: rawPropValue.value,
        abstractValueIdChain: rawPropValue.abstractValueIdChain,
        componentInstance: rawPropValue.componentInstanceId,
        type: PropValueType.Instance,
        valueStruct: rawPropValue.valueStruct,
        app: rawPropValue.appId,
        viewId: rawPropValue.viewId,
        project: rawPropValue.projectId,
        solution: rawPropValue.solutionId
      });
      await em.flush();
      return newPropValue;
    } else {
      if (rawPropValue.abstractValueIdChain) {
        LogicException.assertParamEmpty(rawPropValue.propItemId, 'propItemId');
        LogicException.assertParamEmpty(rawPropValue.componentId, 'componentId');
        LogicException.assertParamEmpty(rawPropValue.componentVersionId, 'componentVersionId');
        LogicException.assertParamEmpty(rawPropValue.solutionId, 'solutionId');

        const newPropValue = em.create(PropValue, {
          propItem: rawPropValue.propItemId,
          component: rawPropValue.componentId,
          valueStruct: rawPropValue.valueStruct,
          componentVersion: rawPropValue.componentVersionId,
          value: rawPropValue.value,
          type: PropValueType.Prototype,
          abstractValueIdChain: rawPropValue.abstractValueIdChain,
          solution: rawPropValue.solutionId
        });

        await em.flush();
        return newPropValue;
      } else {
        LogicException.assertParamEmpty(rawPropValue.propItemId, 'propItemId');
        const propItem = await em.findOne(PropItem, rawPropValue.propItemId);
        LogicException.assertNotFound(propItem, 'PropItem', rawPropValue.propItemId);
        propItem.defaultValue = rawPropValue.value;
        await em.flush();
        return null;
      }
    }
  }
}



