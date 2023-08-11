import { PropItemStruct } from '@grootio/common';
import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException, LogicExceptionCode } from 'config/logic.exception';
import { PropBlock } from 'entities/PropBlock';
import { PropGroup } from 'entities/PropGroup';
import { PropItem } from 'entities/PropItem';

@Injectable()
export class CommonService {

  public async checkPropKeyUnique(componentId: number, componentVersionId: number, em: EntityManager, extraChain?: string) {
    // todo 无法计算没有子节点的 propBlock propGroup 的 propKey重复性
    const chainList = await this.calcAllPropKeyChain(componentId, componentVersionId, em);
    const chainSet = new Set<string>();
    const repeatChainMap = new Map<string, number>();

    if (extraChain) {
      chainList.push(extraChain);
    }

    for (let index = 0; index < chainList.length; index++) {
      const chain = chainList[index];
      if (chainSet.has(chain)) {
        const count = repeatChainMap.get(chain) || 0;
        repeatChainMap.set(chain, count + 1);
      } else {
        chainSet.add(chain);
      }
    }

    return repeatChainMap;
  }

  public async calcPropKeyChain(
    leafType: 'item' | 'block' | 'group', leafId: number, em: EntityManager,
    store?: {
      propItemMap: Map<number, PropItem>,
      propBlockMap: Map<number, PropBlock>,
      propGroupMap: Map<number, PropGroup>
    }
  ): Promise<string> {

    let ctxType = leafType, ctxId = leafId;
    const chainList = [];

    do {
      if (ctxType === 'item') {
        let propItem;
        if (store) {
          propItem = store.propItemMap.get(ctxId);
        } else {
          propItem = await em.findOne(PropItem, ctxId, { fields: ['propKey', 'rootPropKey', 'block'] });
        }
        LogicException.assertNotFound(propItem, 'PropItem', ctxId);

        if (propItem.propKey) {
          chainList.push(propItem.propKey);
          if (propItem.rootPropKey) {
            break;
          }
        } else if (propItem.rootPropKey) {
          throw new LogicException(`propKey cannot empty item id:${propItem.id}`, LogicExceptionCode.UnExpect);
        }

        ctxType = 'block';
        ctxId = propItem.block.id;
      } else if (ctxType === 'block') {
        let propBlock;
        if (store) {
          propBlock = store.propBlockMap.get(ctxId);
        } else {
          propBlock = await em.findOne(PropBlock, ctxId, { fields: ['propKey', 'rootPropKey', 'group'] });
        }

        LogicException.assertNotFound(propBlock, 'PropBlock', ctxId);

        if (propBlock.propKey) {
          chainList.push(propBlock.propKey);
          if (propBlock.rootPropKey) {
            break;
          }
        } else if (propBlock.rootPropKey) {
          throw new LogicException(`propKey cannot empty block id:${propBlock.id}`, LogicExceptionCode.UnExpect);
        }

        ctxType = 'group';
        ctxId = propBlock.group.id;
      } else if (ctxType === 'group') {
        let propGroup;
        if (store) {
          propGroup = store.propGroupMap.get(ctxId);
        } else {
          propGroup = await em.findOne(PropGroup, ctxId, { fields: ['propKey', 'parentItem'] });
        }
        LogicException.assertNotFound(propGroup, 'PropGroup', ctxId);

        if (propGroup.propKey) {
          chainList.push(propGroup.propKey);
        }

        if (propGroup.parentItem?.id) {
          ctxType = 'item';
          ctxId = propGroup.parentItem.id;
        } else {
          ctxType = undefined;
          ctxId = undefined;
        }
      }
    } while (ctxType && ctxId);

    return chainList.reverse().join('.');
  }

  public async calcAllPropKeyChain(componentId: number, componentVersionId: number, em: EntityManager): Promise<string[]> {
    const chainList = [];

    const propItemList = await em.find(PropItem, {
      component: componentId,
      componentVersion: componentVersionId
    }, { fields: ['propKey', 'rootPropKey', 'block'] });
    const propItemMap = new Map<number, PropItem>;
    propItemList.forEach((item) => {
      propItemMap.set(item.id, item);
    })

    const propBlockList = await em.find(PropBlock, {
      component: componentId,
      componentVersion: componentVersionId
    }, { fields: ['propKey', 'rootPropKey', 'group'] });
    const propBlockMap = new Map<number, PropBlock>;
    propBlockList.forEach((block) => {
      propBlockMap.set(block.id, block);
    })

    const propGroupList = await em.find(PropGroup, {
      component: componentId,
      componentVersion: componentVersionId
    }, { fields: ['propKey', 'parentItem'] });
    const propGroupMap = new Map<number, PropGroup>;
    propGroupList.forEach((group) => {
      propGroupMap.set(group.id, group);
    });

    for (let index = 0; index < propItemList.length; index++) {
      const propItem = propItemList[index];
      if (propItem.struct !== PropItemStruct.Hierarchy && propItem.struct !== PropItemStruct.Flat) {
        const chain = await this.calcPropKeyChain('item', propItem.id, em, { propItemMap, propBlockMap, propGroupMap });
        chainList.push(chain);
      }
    }

    return chainList;
  }
}



