import { ComponentInstance, PropMetadataDataItem, PropMetadataData, DragAddComponentPong, PostMessageType, PropBlock, PropGroup, PropItem, PropValueType, ValueStruct, wrapperState, BaseModel, PropItemStruct, viewRender, FormItemRender } from "@grootio/common";
import { commandBridge, grootManager } from "context";
import React from "react";

import PropPersistModel from "./PropPersistModel";

/**
 * 控制属性编辑器整体UI状态
 */
export default class PropHandleModel extends BaseModel {
  static modelName = 'propHandle';

  public propPersist: PropPersistModel;
  public forceUpdateFormKey = 0;
  /**
   * 级联属性分组
   */
  public propItemStack: PropItem[] = [];
  public propPathChainEle: HTMLElement;

  public propFormItemObj = {} as Record<string, React.FC<FormItemRender>>;


  public inject(propPersist: PropPersistModel) {
    this.propPersist = propPersist;
    this.init();
  }


  public setPropPathChain = (itemId?: number) => {
    if (!this.propPathChainEle) {
      return;
    }

    if (!itemId) {
      this.propPathChainEle.innerText = '';
      this.propPathChainEle.dataset['activeId'] = '';
      return;
    }

    const activeId = this.propPathChainEle.dataset['activeId'];
    if (+activeId === itemId) {
      return;
    }

    let path = [];
    const result = this.getPropItem(itemId, path as any);
    if (!result) {
      throw new Error(`not found propItem id: ${itemId}`);
    }
    const propKeyList = path.reduce((pre, current, index) => {
      if (index % 3 === 0) {
        const group = current as PropGroup;
        if (!group.parentItemId && group.propKey) {
          pre.push(group.propKey);
        }
      } else if (index % 3 === 1) {
        const block = current as PropBlock;
        if (block.propKey) {
          pre.push(block.propKey);
        }
      } else if (index % 3 === 2) {
        const item = current as PropItem;
        pre.push(item.propKey);
      }

      return pre;
    }, []) as string[];

    this.propPathChainEle.innerText = propKeyList.join('.');
    this.propPathChainEle.dataset['activeId'] = `${itemId}`;
  }


  /**
   * 向堆栈中追加item分组
   * @param item 追加的PropItem
   */
  public pushPropItemToStack(propItem: PropItem) {
    let removeList = [];

    // 从堆栈中查找同属一个分组的item，移除将其本身以及之后的item
    for (let index = 0; index < this.propItemStack.length; index++) {
      const stackItem = this.propItemStack[index];
      if (stackItem.groupId === propItem.groupId) {
        const rlist = this.propItemStack.splice(index);
        removeList.push(...rlist);
        break;
      } else if (index === this.propItemStack.length - 1) {
        if (stackItem.childGroup.id === propItem.groupId) {
          // 往后追加
          break
        }
        // 全部清空
        const rlist = this.propItemStack.splice(0);
        removeList.push(...rlist);
      }
    }

    // 重置堆栈中item
    this.resetPropItem(removeList);

    this.cancelHighlight(propItem);
    if (this.propItemStack.length) {
      propItem.noSetting = this.propItemStack.at(-1).noSetting;
    }
    propItem.childGroup.templateDesignMode = false;

    // todo 计算坐标
    this.propItemStack.push(propItem);
  }

  /**
   * 从堆栈中弹出item
   * @param propItem 从当前propItem开始之后所有item
   */
  public popPropItemFromStack(propItem: PropItem) {
    const index = this.propItemStack.findIndex(item => item.id === propItem.id);
    if (index !== -1) {
      const isolateItemList = this.propItemStack.splice(index);
      this.resetPropItem(isolateItemList);
    }
  }

  public switchActiveGroup(id: number) {
    const propTree = grootManager.state.getState('gs.propTree')
    const group = propTree.find(g => g.id === id);
    if (!group) {
      return
    }

    const activeGroupId = grootManager.state.getState('gs.activePropGroupId')
    const preActiveGroup = propTree.find(g => g.id === activeGroupId);
    preActiveGroup.templateDesignMode = false;
    grootManager.state.setState('gs.activePropGroupId', id)
  }


  /**
   * 根据ID在属性树中查找对应配置项对象
   * @param itemId 配置项ID
   * @returns 配置项对象
   */
  getPropItem = (itemId: number, pathChain?: [PropItem | PropBlock | PropGroup | null], propTree?: PropGroup[]): PropItem => {
    return this.getPropBlockOrGroupOrItem(itemId, 'item', pathChain, propTree)
  }

  /**
   * 根据ID在属性树中查找对应配置块对象
   * @param blockId 配置块ID
   * @returns 配置块对象
   */
  getPropBlock = (blockId: number, pathChain?: [PropItem | PropBlock | PropGroup], propTree?: PropGroup[]): PropBlock => {
    return this.getPropBlockOrGroupOrItem(blockId, 'block', pathChain, propTree);
  }

  /**
   * 根据ID在属性树中查找对应配置组对象
   * @param groupId 配置组ID
   * @returns 配置组对象
   */
  getPropGroup = (groupId: number, pathChain?: [PropItem | PropBlock | PropGroup], propTree?: PropGroup[]): PropGroup => {
    return this.getPropBlockOrGroupOrItem(groupId, 'group', pathChain, propTree);
  }

  getPropBlockOrGroupOrItem = (id: number, type: 'group' | 'block' | 'item', pathChain?: [PropItem | PropBlock | PropGroup], propTree?: PropGroup[]) => {
    if (!pathChain) {
      pathChain = [] as any;
    }

    const rootGroupList = propTree || grootManager.state.getState('gs.propTree');
    for (let index = 0; index < rootGroupList.length; index++) {
      const rootGroup = rootGroupList[index];

      const pathChainEndIndex = pathChain.length;
      const result = this.getProp(id, type, rootGroup, pathChain);
      if (result) {
        return result;
      }

      pathChain.splice(pathChainEndIndex);
    }

    return null;
  }

  // 使用范型会导致sourceMap信息丢失
  getProp = (id: number, type: 'block' | 'group' | 'item', group: PropGroup, pathChain?: [PropItem | PropBlock | PropGroup]) => {
    const pathChainEndIndex = pathChain.length;
    pathChain.push(group);

    if (type === 'group' && group.id === id) {
      return group;
    }

    const blockList = [...group.propBlockList];

    for (let blockIndex = 0; blockIndex < blockList.length; blockIndex++) {
      const block = blockList[blockIndex];
      const pathChainEndIndex = pathChain.length;
      pathChain.push(block);

      if (type === 'block' && block.id === id) {
        return block;
      }

      const itemList = block.propItemList;
      for (let itemIndex = 0; itemIndex < itemList.length; itemIndex++) {
        const item = itemList[itemIndex];
        const pathChainEndIndex = pathChain.length;
        pathChain.push(item);

        if (type === 'item' && item.id === id) {
          return item;
        }

        if (item.struct === PropItemStruct.Flat || item.struct === PropItemStruct.Hierarchy) {
          if (item.childGroup) {
            const result = this.getProp(id, type, item.childGroup, pathChain);
            if (result) {
              return result;
            }
          } else {
            // 部分item可能已经挂在到rootGroup但是childGroup还没初始化完成
            console.warn(`childGroup can not empty itemId: ${item.id}`);
          }
        }

        pathChain.splice(pathChainEndIndex);
      }

      pathChain.splice(pathChainEndIndex);
    }

    pathChain.splice(pathChainEndIndex);
    return null;
  }

  private resetPropItem(itemList: PropItem[]) {
    itemList.forEach(item => {
      item.tempAbstractValueId = null;
      item.noSetting = false;
      item.extraUIData = undefined;
      this.cancelHighlight(item);
    })
  }

  private cancelHighlight(propItem: PropItem) {
    const group = this.getPropGroup(propItem.groupId);
    group.highlight = false;
    const block = group.propBlockList.find(b => b.id === propItem.blockId);
    block.highlight = false;
    propItem.highlight = false;
  }

  private init() {

    grootManager.hook.registerHook(PostMessageType.InnerDragHitSlot, (detail) => {
      this.addChildInstance(detail);
    })


    commandBridge.removeChildInstance = this.removeChildInstance
    commandBridge.addChildInstance = this.addChildInstance


    const formItemRenderList = grootManager.state.getState('gs.propItem.formRenderList')
    formItemRenderList.forEach((item) => {
      this.propFormItemObj[item.viewType] = item.render
    })

  }


  private addChildInstance(data: DragAddComponentPong) {
    const rawInstance = {
      parentId: data.parentInstanceId,
      solutionInstanceId: data.solutionInstanceId,
      solutionComponentId: data.solutionComponentId
    } as ComponentInstance;

    return this.propPersist.addChildComponentInstance(rawInstance).then((instanceData) => {
      grootManager.state.getState('gs.view').children.push(instanceData)

      const propItem = this.getItemById(data.propItemId, data.parentInstanceId);
      const propValue = propItem.valueList.filter(v => v.type === PropValueType.Instance).find(value => {
        return value.abstractValueIdChain === data.abstractValueIdChain || (!value.abstractValueIdChain && !data.abstractValueIdChain)
      });
      const value = JSON.parse(propValue?.value || '{"setting": {},"list":[]}') as PropMetadataData;

      let order = 1000;
      if (data.currentInstanceId) {
        const activeIndex = value.list.findIndex(item => item.instanceId === data.currentInstanceId);

        if (data.direction === 'next') {
          if (activeIndex === value.list.length - 1) {
            order = value.list[activeIndex].order + 1000;
          } else {
            order = (value.list[activeIndex].order + value.list[activeIndex + 1].order) / 2;
          }
        } else {
          if (activeIndex === 0) {
            order = value.list[activeIndex].order / 2;
          } else {
            order = (value.list[activeIndex - 1].order + value.list[activeIndex].order) / 2;
          }
        }
      }
      const newValueItem = {
        instanceId: instanceData.id,
        componentName: instanceData.component.name,
        componentId: instanceData.component.id,
        order
      } as PropMetadataDataItem;

      value.list.push(newValueItem);
      value.list = value.list.sort((a, b) => a.order - b.order);

      this.propPersist.updateValue({
        immediate: true,
        propItem, value,
        abstractValueIdChain: data.abstractValueIdChain,
        valueStruct: ValueStruct.ChildComponentList,
        hostComponentInstanceId: data.parentInstanceId
      }).then(() => {
        grootManager.command.executeCommand('gc.pushMetadata');

        setTimeout(() => {
          grootManager.hook.callHook(PostMessageType.OuterComponentSelect, instanceData.id)
        }, 100)
      })
    })
  }

  public removeChildInstance(instanceId: number, itemId: number, abstractValueIdChain?: string) {
    return this.propPersist.removeChildInstance(instanceId, itemId, abstractValueIdChain).then(() => {
      const { children } = grootManager.state.getState('gs.view');

      const instanceIndex = children.findIndex(i => i.id === instanceId);
      const instance = children[instanceIndex];
      children.splice(instanceIndex, 1);

      grootManager.command.executeCommand('gc.pushMetadata');

      setTimeout(() => {// 等待内嵌iframe页面视图更新完成
        const componentInstance = grootManager.state.getState('gs.activeComponentInstance');
        if (componentInstance.id === instanceId) {
          grootManager.command.executeCommand('gc.selectInstance', instance.parentId)
        }
      }, 100)

      // this.forceUpdateFormKey++;
    })
  }

  public renderFormItem(propItem: PropItem, formItemProps: any, simplify: boolean) {
    if (this.propFormItemObj[propItem.viewType]) {
      const view = this.propFormItemObj[propItem.viewType]
      return viewRender(view, { propItem, simplify, formItemProps })
    } else if (this.propFormItemObj['*']) {
      const view = this.propFormItemObj['*']
      return viewRender(view, { propItem, simplify, formItemProps })
    } else {
      return React.createElement(React.Fragment, null, '未识别的类型')
    }
  }

  private getItemById(propItemId: number, instanceId: number) {
    const { root, children } = grootManager.state.getState('gs.view');
    const instance = [root, ...children].find(item => item.id === instanceId);

    if (!instance) {
      return null;
    }


    for (let itemIndex = 0; itemIndex < instance.itemList.length; itemIndex++) {
      const item = instance.itemList[itemIndex];
      if (item.id === propItemId) {
        return item;
      }
    }

    return null;
  }
}