import { APIPath, BaseModel, ComponentInstance, PropBlock, PropGroup, PropItem, PropItemStruct, PropMetadataComponent, PropValue, PropValueType, StudioMode, ValueStruct } from "@grootio/common";
import { getContext, grootManager } from "context";
import { getComponentVersionId } from "share";

import { assignBaseType, autoIncrementForName, calcPropValueIdChain, stringifyOptions } from "util/index";
import PropHandleModel from "./PropHandleModel";

/**
 * 负责属性编辑器涉及到的接口调用，以及相关UI状态
 */
export default class PropPersistModel extends BaseModel {
  static modelName = 'propPersist';

  /**
   * 正在配置的分组
   */
  public currSettingPropGroup?: PropGroup;
  /**
   * 正在配置的块
   */
  public currSettingPropBlock?: PropBlock;
  /**
   * 正在配置的项
   */
  public currSettingPropItem?: PropItem;
  /**
   * 模态层请求提交中
   */
  public settingModalSubmitting = false;

  private request = getContext().request;

  private propHandle: PropHandleModel

  public inject(propHandle: PropHandleModel) {
    this.propHandle = propHandle;
  }

  public movePropBlock(group: PropGroup, originIndex: number, up: boolean) {
    const originBlock = group.propBlockList[originIndex];
    const targetId = up ? group.propBlockList[originIndex - 1].id : group.propBlockList[originIndex + 1].id;

    this.request(APIPath.move_position, {
      originId: originBlock.id,
      targetId,
      type: 'block'
    }).then(() => {
      if (up) {
        const targetBlock = group.propBlockList[originIndex - 1];
        group.propBlockList[originIndex - 1] = originBlock;
        group.propBlockList[originIndex] = targetBlock;
      } else {
        const targetBlock = group.propBlockList[originIndex + 1];
        group.propBlockList[originIndex + 1] = originBlock;
        group.propBlockList[originIndex] = targetBlock;
      }
    });
  }

  public movePropGroup(dragId: string, hoverId: string) {
    if (dragId === hoverId) {
      return;
    }

    this.request(APIPath.move_position, {
      originId: +dragId,
      targetId: hoverId === '__add' ? null : +hoverId,
      type: 'group'
    }).then(() => {
      const groups = this.propHandle.propTree;

      const drag = groups.find(g => g.id === +dragId)!;
      const hoverIndex = hoverId === '__add' ? groups.length : groups.findIndex(g => g.id === +hoverId);
      const dragIndex = groups.findIndex(g => g.id === +dragId);
      const currentIndex = groups.findIndex(g => g.id === this.propHandle.activeGroupId);

      groups.splice(hoverIndex, 0, drag);

      if (hoverIndex < dragIndex) {
        groups.splice(dragIndex + 1, 1);
        if (currentIndex >= hoverIndex && currentIndex < dragIndex) {
          this.propHandle.activeGroupId = groups[currentIndex + 1].id;
        } else if (currentIndex === dragIndex) {
          this.propHandle.activeGroupId = +hoverId
        }
      } else {
        if (currentIndex === dragIndex && currentIndex < hoverIndex) {
          this.propHandle.activeGroupId = groups[currentIndex - 1]?.id
        } else if (currentIndex === dragIndex) {
          this.propHandle.activeGroupId = groups[hoverIndex - 1]?.id
        }
        groups.splice(dragIndex, 1);
      }
    })
  }

  public movePropItem(block: PropBlock, originIndex: number, up: boolean) {
    const originItem = block.propItemList[originIndex];
    const targetId = up ? block.propItemList[originIndex - 1].id : block.propItemList[originIndex + 1].id;

    this.request(APIPath.move_position, {
      originId: originItem.id,
      targetId,
      type: 'item'
    }).then(() => {
      if (up) {
        const targetItem = block.propItemList[originIndex - 1];
        block.propItemList[originIndex - 1] = originItem;
        block.propItemList[originIndex] = targetItem;
      } else {
        const targetItem = block.propItemList[originIndex + 1];
        block.propItemList[originIndex + 1] = originItem;
        block.propItemList[originIndex] = targetItem;
      }
    });
  }

  public updateOrAddPropGroup(group: PropGroup) {
    const groupData = Object.assign(this.currSettingPropGroup, group);

    groupData.componentId = grootManager.state.getState('gs.component').id
    groupData.componentVersionId = getComponentVersionId()

    this.settingModalSubmitting = true;
    if (groupData.id) {
      this.request(APIPath.group_update, groupData).then(() => {
        let groupIndex = this.propHandle.propTree.findIndex(g => g.id === groupData.id);
        assignBaseType(this.propHandle.propTree[groupIndex], groupData);

        this.currSettingPropGroup = undefined;
        grootManager.command.executeCommand('gc.makeDataToStage', 'current');
      }).finally(() => {
        this.settingModalSubmitting = false;
      })
    } else {
      this.request(APIPath.group_add, groupData).then(({ data: { newGroup, extra } }) => {
        newGroup.expandBlockIdList = [];
        newGroup.propBlockList = [];
        this.propHandle.propTree.push(newGroup);
        this.propHandle.activeGroupId = newGroup.id;

        // 补充新创建配置块相关属性
        if (extra?.newBlock) {
          extra.newBlock.group = newGroup;
          extra.newBlock.propItemList = [];
          newGroup.propBlockList.push(extra.newBlock);
        }

        this.currSettingPropGroup = undefined;
        grootManager.command.executeCommand('gc.makeDataToStage', 'current');
      }).finally(() => {
        this.settingModalSubmitting = false;
      })
    }
  }

  public updateOrAddPropBlock(block: PropBlock) {
    const blockData = Object.assign(this.currSettingPropBlock, block);
    const group = this.propHandle.getPropGroup(blockData.groupId);

    this.settingModalSubmitting = true;
    if (blockData.id) {
      this.request(APIPath.block_update, blockData).then(() => {
        let blockIndex = group.propBlockList.findIndex(b => b.id === blockData.id);
        assignBaseType(group.propBlockList[blockIndex], blockData);
        this.currSettingPropBlock = undefined;
        grootManager.command.executeCommand('gc.makeDataToStage', 'current');
      }).finally(() => {
        this.settingModalSubmitting = false;
      })
    } else {
      this.request(APIPath.block_add, blockData).then(({ data: { newBlock, extra } }) => {
        group.propBlockList.push(newBlock);
        newBlock.group = group;
        newBlock.propItemList = [];
        newBlock.listStructData = [];
        group.expandBlockIdList.push(newBlock.id);

        if (extra?.childGroup) {
          newBlock.propItemList = [extra.newItem];
          extra.newItem.childGroup = extra.childGroup;
          extra.newItem.valueList = [];
          extra.newItem.block = newBlock;

          extra.childGroup.parentItem = extra.newItem;
          extra.childGroup.expandBlockIdList = [];
          extra.childGroup.propBlockList = [];
        }

        this.currSettingPropBlock = undefined;
        grootManager.command.executeCommand('gc.makeDataToStage', 'current');
      }).finally(() => {
        this.settingModalSubmitting = false;
      })

    }
  }

  public updateOrAddPropItem(item: PropItem) {
    const itemData = Object.assign(this.currSettingPropItem, item);

    stringifyOptions(itemData);

    this.settingModalSubmitting = true;
    if (itemData.id) {
      this.request(APIPath.item_update, itemData).then(({ data }) => {
        const block = this.propHandle.getPropBlock(data.blockId);
        let itemIndex = block.propItemList.findIndex(item => item.id === data.id);
        // block.propItemList.splice(itemIndex, 1, propItem);
        const originItem = block.propItemList[itemIndex];
        assignBaseType(originItem, data);
        originItem.optionList = itemData.optionList;

        this.currSettingPropItem = undefined;
        grootManager.command.executeCommand('gc.makeDataToStage', 'current');
      }).finally(() => {
        this.settingModalSubmitting = false;
      })
    } else {
      this.request(APIPath.item_add, itemData).then(({ data: { newItem, childGroup, extra } }) => {
        newItem.valueList = [];
        newItem.optionList = itemData.optionList;
        const block = this.propHandle.getPropBlock(newItem.blockId);
        block.propItemList.push(newItem);
        newItem.block = block;
        const group = this.propHandle.getPropGroup(block.groupId);
        group.expandBlockIdList.push(block.id);

        if (childGroup) {
          childGroup.expandBlockIdList = [];
          childGroup.propBlockList = [];
          newItem.childGroup = childGroup;
          childGroup.parentItem = newItem;

          if (extra?.newBlock) {
            extra.newBlock.propItemList = [];
            extra.newBlock.group = childGroup;
            childGroup.propBlockList.push(extra.newBlock);
          }
        }

        this.currSettingPropItem = undefined;
        grootManager.command.executeCommand('gc.makeDataToStage', 'current');
      }).finally(() => {
        this.settingModalSubmitting = false;
      })
    }
  }

  public delGroup(groupId: number) {
    this.request(APIPath.group_remove_groupId, { groupId }).then(() => {
      const index = this.propHandle.propTree.findIndex(g => g.id === groupId);
      this.propHandle.propTree.splice(index, 1);

      if (this.propHandle.activeGroupId === groupId) {
        this.propHandle.activeGroupId = this.propHandle.propTree[0]?.id
      }
      grootManager.command.executeCommand('gc.makeDataToStage', 'current');
    })
  }

  public delBlock(blockId: number, group: PropGroup) {
    this.request(APIPath.block_remove_blockId, { blockId }).then(() => {
      let blockIndex = group.propBlockList.findIndex(b => b.id === blockId);
      group.propBlockList.splice(blockIndex, 1);
      grootManager.command.executeCommand('gc.makeDataToStage', 'current');
    })
  }

  public delItem(itemId: number, block: PropBlock) {
    this.request(APIPath.item_remove_itemId, { itemId }).then(() => {
      let itemIndex = block.propItemList.findIndex(item => item.id === itemId);
      block.propItemList.splice(itemIndex, 1);
      grootManager.command.executeCommand('gc.makeDataToStage', 'current');
    })
  }

  public showPropBlockSettinngForCreate(group: PropGroup) {
    const nameSuffix = autoIncrementForName(group.propBlockList.map(b => b.name));

    this.currSettingPropBlock = {
      name: `配置块${nameSuffix}`,
      groupId: group.id,
    } as PropBlock;
  }

  public showPropItemSettinngForCreate(block: PropBlock) {
    const nameSuffix = autoIncrementForName(block.propItemList.map(item => item.label));
    const propSuffix = autoIncrementForName(block.propItemList.map(item => item.propKey));

    this.currSettingPropItem = {
      struct: PropItemStruct.Normal,
      label: `配置项${nameSuffix}`,
      propKey: `prop${propSuffix}`,
      blockId: block.id,
      groupId: block.groupId,
      span: 24,
    } as PropItem;
  }

  public saveBlockListPrimaryItem(propBlock: PropBlock, data: number[]) {
    this.request(APIPath.block_listStructPrimaryItem_save, {
      blockId: propBlock.id,
      data: JSON.stringify(data)
    }).then(() => {
      propBlock.listStructData = data;
      this.propHandle.popPropItemFromStack(propBlock.propItemList[0]);
    })
  }

  public addAbstractTypeValue(propItem: PropItem) {
    const abstractValueIdChain = calcPropValueIdChain(propItem);
    const component = grootManager.state.getState('gs.component');

    const paramsData = {
      propItemId: propItem.id,
      abstractValueIdChain,
      componentVersionId: getComponentVersionId(),
      componentId: component.id,
    } as PropValue;

    if (getContext().params.mode === StudioMode.Prototype) {
      paramsData.type = PropValueType.Prototype;
    } else {
      const componentInstance = grootManager.state.getState('gs.componentInstance')
      paramsData.type = PropValueType.Instance;
      paramsData.releaseId = grootManager.state.getState('gs.release').id
      paramsData.componentInstanceId = componentInstance.id;
    }

    this.request(APIPath.value_abstractType_add, paramsData).then(({ data }) => {
      propItem.valueList.push(data);
      grootManager.command.executeCommand('gc.makeDataToStage', 'current');
    })
  }

  public removeBlockListStructChildItem(propValueId: number, propItem: PropItem) {
    this.request(APIPath.value_abstractType_remove_propValueId, { propValueId }).then(() => {
      propItem.valueList = propItem.valueList.filter(v => v.id !== propValueId);
      grootManager.command.executeCommand('gc.makeDataToStage', 'current');
    })
  }

  public updateValue({ propItem, value, abstractValueId, abstractValueIdChain, valueStruct, hostComponentInstanceId }: { propItem: PropItem, value: any, abstractValueId?: number, abstractValueIdChain?: string, valueStruct?: ValueStruct, hostComponentInstanceId?: number }) {
    if (!abstractValueIdChain) {
      abstractValueIdChain = calcPropValueIdChain(propItem, abstractValueId);
    }
    const propValue = propItem.valueList.filter(value => {
      const isPrototypeMode = getContext().params.mode === StudioMode.Prototype;
      return value.type === (isPrototypeMode ? PropValueType.Prototype : PropValueType.Instance)
    }).find(value => {
      return value.abstractValueIdChain === abstractValueIdChain || (!value.abstractValueIdChain && !abstractValueIdChain)
    });

    let paramData = {} as PropValue;

    const valueStr = value !== undefined ? JSON.stringify(value) : ''

    if (propValue) {
      paramData.id = propValue.id;
      paramData.value = valueStr;
    } else {
      const component = grootManager.state.getState('gs.component');
      const isPrototypeMode = getContext().params.mode === StudioMode.Prototype;

      paramData.abstractValueIdChain = abstractValueIdChain;
      paramData.propItemId = propItem.id;
      paramData.componentId = component.id;
      paramData.componentVersionId = getComponentVersionId();
      paramData.value = valueStr;
      paramData.valueStruct = valueStruct;

      if (isPrototypeMode) {
        paramData.type = PropValueType.Prototype;
      } else {
        const componentInstance = grootManager.state.getState('gs.componentInstance')
        const allComponentInstance = grootManager.state.getState('gs.allComponentInstance')
        paramData.type = PropValueType.Instance;
        paramData.releaseId = grootManager.state.getState('gs.release').id
        paramData.componentInstanceId = componentInstance.id;

        if (hostComponentInstanceId) {
          paramData.componentInstanceId = hostComponentInstanceId;
          const instance = allComponentInstance.find(item => item.id === hostComponentInstanceId);
          paramData.componentId = instance.component.id;
          paramData.componentVersionId = instance.componentVersion.id;
        }
      }
    }

    return this.request(APIPath.value_update, paramData).then(({ data }) => {
      if (propValue) {
        propValue.value = valueStr;
      } else if ((paramData as any).type === PropValueType.Instance) {
        propItem.valueList.push(data);
      } else if (abstractValueIdChain) {
        propItem.valueList.push(data);
      } else {
        propItem.defaultValue = valueStr;
      }
    });
  }

  public addChildComponentInstance(rawInstance: ComponentInstance) {
    return this.request(APIPath.componentInstance_addChild, rawInstance).then(({ data }) => data);
  }

  public removeChildInstance(instanceId: number, itemId: number, abstractValueIdChain?: string) {
    const allComponentInstance = grootManager.state.getState('gs.allComponentInstance')

    return this.request(APIPath.componentInstance_remove_instanceId, { instanceId }).then(() => {
      let propItem;
      for (let index = 0; index < allComponentInstance.length; index++) {
        const instance = allComponentInstance[index];
        propItem = this.propHandle.getPropItem(itemId, [null], instance.propTree);
        if (propItem) {
          break;
        }
      }

      const propValue = propItem.valueList.filter(v => v.type === PropValueType.Instance).find(value => {
        return value.abstractValueIdChain === abstractValueIdChain || (!value.abstractValueIdChain && !abstractValueIdChain)
      });

      const componentValue = JSON.parse(propValue.value) as PropMetadataComponent;
      const index = componentValue.list.findIndex(i => i.instanceId === instanceId);
      componentValue.list.splice(index, 1);

      return this.updateValue({ propItem, value: componentValue, abstractValueIdChain: propValue.abstractValueIdChain, valueStruct: ValueStruct.ChildComponentList })
    });
  }

}
