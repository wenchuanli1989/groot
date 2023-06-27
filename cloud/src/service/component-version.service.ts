import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { pick, PropValueType } from '@grootio/common';

import { LogicException, LogicExceptionCode } from 'config/logic.exception';
import { ComponentVersion } from 'entities/ComponentVersion';
import { PropBlock } from 'entities/PropBlock';
import { PropGroup } from 'entities/PropGroup';
import { PropItem } from 'entities/PropItem';
import { PropValue } from 'entities/PropValue';
import { PropBlockService } from './prop-block.service';
import { PropGroupService } from './prop-group.service';
import { PropItemService } from './prop-item.service';
import { SolutionComponent } from 'entities/SolutionComponent';

const tempIdData = {
  itemId: 1,
  blockId: 1,
  groupId: 1,
  valueId: 1
}


@Injectable()
export class ComponentVersionService {

  constructor(
    public propGroupService: PropGroupService,
    public propBlockService: PropBlockService,
    public propItemService: PropItemService
  ) { }

  async add(rawComponentVersion: ComponentVersion) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawComponentVersion.name, 'name');
    LogicException.assertParamEmpty(rawComponentVersion.imageVersionId, 'imageVersionId');

    const imageComponentVersion = await em.findOne(ComponentVersion, rawComponentVersion.imageVersionId);
    LogicException.assertNotFound(imageComponentVersion, 'ComponentVersion', rawComponentVersion.imageVersionId);

    // 保证版本名唯一性
    // todo ... 可能存在并发问题
    const count = await em.count(ComponentVersion, { component: imageComponentVersion.component, name: rawComponentVersion.name });
    if (count > 0) {
      throw new LogicException(`组件版本名称冲突`, LogicExceptionCode.NotUnique);
    }

    const originGroupList = await em.find(PropGroup, { component: imageComponentVersion.component, componentVersion: imageComponentVersion });
    const originBlockList = await em.find(PropBlock, { component: imageComponentVersion.component, componentVersion: imageComponentVersion });
    const originItemList = await em.find(PropItem, { component: imageComponentVersion.component, componentVersion: imageComponentVersion });
    const originValueList = await em.find(PropValue, { component: imageComponentVersion.component, componentVersion: imageComponentVersion, type: PropValueType.Prototype });

    const groupMap = new Map<number, PropGroup>();
    const blockMap = new Map<number, PropBlock>();
    const itemMap = new Map<number, PropItem>();
    const valueMap = new Map<number, PropValue>();

    const componentVersion = em.create(ComponentVersion, {
      name: rawComponentVersion.name,
      component: imageComponentVersion.component
    });

    await em.begin();
    try {
      // 创建组件版本
      await em.flush();

      for (let groupIndex = 0; groupIndex < originGroupList.length; groupIndex++) {
        const originGroup = originGroupList[groupIndex];
        const group = em.create(PropGroup, {
          ...pick(originGroup,
            ['name', 'propKey', 'order', 'component', 'struct']
          ),
          componentVersion
        }
        );
        groupMap.set(originGroup.id, group);
      }

      for (let blockIndex = 0; blockIndex < originBlockList.length; blockIndex++) {
        const originBlock = originBlockList[blockIndex];
        const block = em.create(PropBlock, {
          ...pick(originBlock,
            ['name', 'rootPropKey', 'propKey', 'order', 'component', 'struct', 'layout']
          ),
          componentVersion,
          group: tempIdData.groupId
        }
        );
        blockMap.set(originBlock.id, block);
      }

      for (let itemIndex = 0; itemIndex < originItemList.length; itemIndex++) {
        const originItem = originItemList[itemIndex];
        const item = em.create(PropItem, {
          ...pick(originItem,
            ['label', 'propKey', 'struct', 'valueOptions', 'viewType', 'span', 'rootPropKey', 'order', 'component', 'versionTraceId', 'defaultValue']
          ),
          componentVersion,
          block: tempIdData.blockId,
          group: tempIdData.groupId,
        });
        itemMap.set(originItem.id, item);
      }

      for (let valueIndex = 0; valueIndex < originValueList.length; valueIndex++) {
        const originValue = originValueList[valueIndex];
        const value = em.create(PropValue, {
          ...pick(originValue,
            ['value', 'abstractValueIdChain', 'component', 'type', 'order', 'valueStruct']
          ),
          componentVersion,
          propItem: tempIdData.itemId
        });
        valueMap.set(originValue.id, value);
      }

      await em.flush();
      // 还原关联关系
      /////////////////////////////////////////////////////////////////////////////////////////////////////////

      for (let valueIndex = 0; valueIndex < originValueList.length; valueIndex++) {
        const originValue = originValueList[valueIndex];
        const value = valueMap.get(originValue.id);
        value.propItem = itemMap.get(originValue.propItem.id);
        if (originValue.abstractValueIdChain) {
          const valueIdList = originValue.abstractValueIdChain.split(',');
          const newValueIdList = valueIdList.map((valueId) => {
            return valueMap.get(+valueId).id;
          });
          value.abstractValueIdChain = newValueIdList.join(',');
        }
      }

      for (let itemIndex = 0; itemIndex < originItemList.length; itemIndex++) {
        const originItem = originItemList[itemIndex];
        const item = itemMap.get(originItem.id);
        item.block = blockMap.get(originItem.block.id);
        item.group = groupMap.get(originItem.group.id);
        if (originItem.childGroup) {
          item.childGroup = groupMap.get(originItem.childGroup.id);;
        }
      }

      for (let blockIndex = 0; blockIndex < originBlockList.length; blockIndex++) {
        const originBlock = originBlockList[blockIndex];
        const block = blockMap.get(originBlock.id);
        block.group = groupMap.get(originBlock.group.id);

        if (originBlock.listStructData) {
          const itemIdList = JSON.parse(originBlock.listStructData) as number[];
          const newListStructData = itemIdList.map((itemId) => {
            return itemMap.get(itemId).id;
          });
          block.listStructData = JSON.stringify(newListStructData);
        }
      }

      for (let groupIndex = 0; groupIndex < originGroupList.length; groupIndex++) {
        const originGroup = originGroupList[groupIndex];
        const group = groupMap.get(originGroup.id);
        if (originGroup.parentItem) {
          group.parentItem = itemMap.get(originGroup.parentItem.id);
        }
      }
      await em.flush();

      await em.commit();
    } catch (e) {
      await em.rollback();
      throw e;
    }

    return componentVersion;
  }

  async publish(componentVersionId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(componentVersionId, 'componentVersionId');

    const componentVersion = await em.findOne(ComponentVersion, componentVersionId, { populate: ['component'] });
    LogicException.assertNotFound(componentVersion, 'ComponentVersion', componentVersionId);

    componentVersion.component.recentVersion = componentVersion;
    componentVersion.publish = true;
    await em.flush();
  }

  async getBySolutionVersionIdAndComponentId(solutionVersionId: number, componentId: number) {
    LogicException.assertParamEmpty(solutionVersionId, 'solutionVersionId');
    LogicException.assertParamEmpty(componentId, 'componentId');

    const em = RequestContext.getEntityManager();

    const solutionComponent = await em.findOne(SolutionComponent,
      { solutionVersion: solutionVersionId },
      { populate: ['componentVersion'], populateWhere: { componentVersion: { component: componentId } } }
    )

    return solutionComponent?.componentVersion
  }
}



