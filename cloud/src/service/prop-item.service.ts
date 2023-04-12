import { pick, PropGroupStructType, PropItemStruct, PropValueType } from '@grootio/common';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { LogicException, LogicExceptionCode } from 'config/logic.exception';
import { PropBlock } from 'entities/PropBlock';
import { PropGroup } from 'entities/PropGroup';
import { PropItem } from 'entities/PropItem';
import { PropValue } from 'entities/PropValue';
import { CommonService } from './common.service';
import { PropGroupService } from './prop-group.service';

@Injectable()
export class PropItemService {

  constructor(
    private propGroupService: PropGroupService,
    private commonService: CommonService,
  ) { }

  async add(rawItem: PropItem, parentEm?: EntityManager) {
    let em = parentEm || RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawItem.blockId, 'blockId');
    const block = await em.findOne(PropBlock, rawItem.blockId);
    LogicException.assertNotFound(block, 'PropBlock', rawItem.blockId);

    if (rawItem.struct !== PropItemStruct.Flat && rawItem.struct !== PropItemStruct.Hierarchy && !rawItem.propKey) {
      throw new LogicException(`配置项propKey不能为空`, LogicExceptionCode.ParamError);
    }

    if (rawItem.propKey) {
      let repeatChainMap: Map<string, number>;
      if (rawItem.rootPropKey === true) {
        repeatChainMap = await this.commonService.checkPropKeyUnique(block.component.id, block.componentVersion.id, em, rawItem.propKey);
      } else {
        const blockPropKeyChain = await this.commonService.calcPropKeyChain('block', block.id, em);
        const extraChain = `${blockPropKeyChain}.${rawItem.propKey}`.replace(/^\.|\.$/gi, '');
        repeatChainMap = await this.commonService.checkPropKeyUnique(block.component.id, block.componentVersion.id, em, extraChain);
      }

      if (repeatChainMap.size > 0) {
        throw new LogicException(`配置项propKey冲突，该值必须在组件范围唯一`, LogicExceptionCode.NotUnique);
      }
    }

    let result: { newItem?: PropItem, childGroup?: PropGroup, extra?: { newBlock?: PropBlock } } = {};

    const firstItem = await em.findOne(PropItem, { block }, { orderBy: { order: 'DESC' } });

    const newItem = em.create(PropItem, {
      ...pick(rawItem, ['label', 'propKey', 'rootPropKey', 'struct', 'viewType', 'span', 'valueOptions', 'versionTraceId']),
      block,
      group: block.group,
      component: block.component,
      componentVersion: block.componentVersion,
      order: firstItem ? firstItem.order + 1000 : 1000,
    });

    let parentCtx = parentEm ? em.getTransactionContext() : undefined;
    await em.begin();
    try {

      await em.flush();

      // if (rawItem.type === PropItemType.Component) {
      //   em.create(PropValue, {
      //     type: PropValueType.Prototype,
      //     propItem: newItem,
      //     component: newItem.component,
      //     componentVersion: newItem.componentVersion,
      //     value: '{"setting":{},"list":[]}'
      //   });
      //   await em.flush();
      // }

      if (!rawItem.versionTraceId) {
        newItem.versionTraceId = newItem.id;
      }

      await em.flush();

      if (newItem.struct === PropItemStruct.Hierarchy || newItem.struct === PropItemStruct.Flat) {
        let groupStruct = PropGroupStructType.Default;
        if (newItem.struct === PropItemStruct.Flat) {
          groupStruct = PropGroupStructType.Flat
        }
        const rawGroup = {
          name: '内嵌配置组',
          componentId: block.component.id,
          componentVersionId: block.componentVersion.id,
          struct: groupStruct
        } as PropGroup;
        const { newGroup, extra } = await this.propGroupService.add(rawGroup, em);
        newGroup.parentItem = newItem;
        newItem.childGroup = newGroup;

        result.childGroup = newGroup;
        result.extra = extra;
        await em.flush();
      }

      await em.commit();

    } catch (e) {
      await em.rollback();
      throw e;
    } finally {
      if (parentCtx) {
        em.setTransactionContext(parentCtx);
      }
    }

    result.newItem = newItem;
    return result;
  }

  /**
   * 单步异动，该方法不能实现跨越异动
   */
  async movePosition(originId: number, targetId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(originId, 'originId');
    const originItem = await em.findOne(PropItem, originId);
    LogicException.assertNotFound(originItem, 'PropItem', originId);

    const targetItem = await em.findOne(PropItem, targetId);
    LogicException.assertNotFound(targetItem, 'PropItem', targetId);

    const order = targetItem.order;
    targetItem.order = originItem.order;
    originItem.order = order;

    await em.flush();
  }

  async remove(itemId: number, parentEm?: EntityManager) {
    let em = parentEm || RequestContext.getEntityManager();

    const propItem = await em.findOne(PropItem, itemId);

    LogicException.assertNotFound(propItem, 'PropItem', itemId);

    const parentCtx = parentEm ? em.getTransactionContext() : undefined;
    await em.begin();
    try {
      await em.removeAndFlush(propItem);

      if (!!propItem.childGroup) {
        await this.propGroupService.remove(propItem.childGroup.id, em);
      }

      await em.nativeDelete(PropValue, {
        abstractValueIdChain: { $like: `${propItem.id}` },
        type: PropValueType.Prototype
      });

      await em.commit();
    } catch (e) {
      await em.rollback();
      throw e;
    } finally {
      if (parentCtx) {
        em.setTransactionContext(parentCtx);
      }
    }
  }

  async update(rawItem: PropItem) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawItem.id, 'id');
    const propItem = await em.findOne(PropItem, rawItem.id);
    LogicException.assertNotFound(propItem, 'PropItem', rawItem.id);


    await em.begin();
    try {
      const typeChange = rawItem.viewType !== propItem.viewType
      if (typeChange) {
        propItem.versionTraceId = propItem.id;
        await em.nativeDelete(PropValue, {
          abstractValueIdChain: { $like: `${propItem.id}` },
          type: PropValueType.Prototype
        });
      }
      pick(rawItem, ['label', 'propKey', 'rootPropKey', 'viewType', 'span', 'valueOptions'], propItem);
      if (typeChange) {
        propItem.defaultValue = '';
      }
      await em.flush();

      // warning!!! flush之后可以查到最新的数据吗？
      if ((rawItem.propKey !== propItem.propKey) || (rawItem.rootPropKey !== propItem.rootPropKey)) {
        const repeatChainMap = await this.commonService.checkPropKeyUnique(propItem.component.id, propItem.componentVersion.id, em);
        if (repeatChainMap.size > 0) {
          throw new LogicException(`配置项propKey冲突，该值必须在组件范围唯一`, LogicExceptionCode.NotUnique);
        }
      }

      await em.commit();
    } catch (e) {
      await em.rollback();
      throw e;
    }

    return propItem;
  }
}



