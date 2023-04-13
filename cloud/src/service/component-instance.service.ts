import { PropMetadataComponent, pick, PropValueType, ValueStruct, ExtensionRelationType } from '@grootio/common';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { LogicException, LogicExceptionCode } from 'config/logic.exception';
import { Component } from 'entities/Component';
import { ComponentInstance } from 'entities/ComponentInstance';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { PropBlock } from 'entities/PropBlock';
import { PropGroup } from 'entities/PropGroup';
import { PropItem } from 'entities/PropItem';
import { PropValue } from 'entities/PropValue';
import { Release } from 'entities/Release';
import { SolutionInstance } from 'entities/SolutionInstance';
import { State } from 'entities/State';

@Injectable()
export class ComponentInstanceService {

  // root key entry wrapper parserType
  async addRoot(rawInstance: ComponentInstance) {
    let em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawInstance.key, 'key');
    LogicException.assertParamEmpty(rawInstance.name, 'name');
    LogicException.assertParamEmpty(rawInstance.releaseId, 'releaseId');

    if (!rawInstance.componentId && !rawInstance.wrapper) {
      throw new LogicException('componentId和wrapper不能同时为空', LogicExceptionCode.ParamError);
    }

    let wrapperRawInstance;

    if (rawInstance.wrapper) {
      const [packageName, componentName] = rawInstance.wrapper.split('/');
      const wrapperComponent = await em.findOne(Component, { packageName, componentName });
      LogicException.assertNotFound(wrapperComponent, 'Component');

      wrapperRawInstance = pick(rawInstance, ['name', 'key', 'releaseId', 'entry']);
      wrapperRawInstance.componentId = wrapperComponent.id;
    }

    if (rawInstance.wrapper && !rawInstance.componentId) {
      return await this.add(wrapperRawInstance, em);
    } else if (rawInstance.componentId && !rawInstance.wrapper) {
      return await this.add(rawInstance, em);
    } else {
      return await this.addRootForWrapper(rawInstance, wrapperRawInstance, em);
    }
  }

  async add(rawInstance: ComponentInstance, parentEm?: EntityManager) {
    let em = parentEm || RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawInstance.componentId, 'componentId');
    LogicException.assertParamEmpty(rawInstance.releaseId, 'releaseId');

    const component = await em.findOne(Component, rawInstance.componentId);
    LogicException.assertNotFound(component, 'Component', rawInstance.componentId);

    const release = await em.findOne(Release, rawInstance.releaseId);
    LogicException.assertNotFound(release, 'Release', rawInstance.releaseId);

    const solutionInstance = await em.findOne(SolutionInstance, rawInstance.solutionInstanceId);
    LogicException.assertNotFound(solutionInstance, 'SolutionInstance', rawInstance.solutionInstanceId);

    if (rawInstance.key) {
      if (rawInstance.rootId) {
        throw new LogicException(`如果传递参数key，则不能传递参数rootId`, LogicExceptionCode.UnExpect);
      }

      if (rawInstance.parentId) {
        throw new LogicException(`如果传递参数key，则不能传递参数parentId`, LogicExceptionCode.UnExpect);
      }

      const count = await em.count(ComponentInstance, {
        key: rawInstance.key,
        release
      });

      if (count > 0) {
        throw new LogicException(`参数key冲突，该值必须在全局唯一`, LogicExceptionCode.NotUnique);
      }
    } else {
      if (!rawInstance.parentId) {
        throw new LogicException(`如果不传递参数key，则必须传递参数parentId`, LogicExceptionCode.UnExpect);
      }

      if (!rawInstance.rootId) {
        throw new LogicException(`如果不传递参数key，则必须传递参数rootId`, LogicExceptionCode.UnExpect);
      }
    }

    const valueMap = new Map<number, PropValue>();
    const newValueList = [];

    const prototypeValueList = await em.find(PropValue, {
      component,
      componentVersion: component.recentVersion,
      type: PropValueType.Prototype
    });

    const newInstance = em.create(ComponentInstance, {
      ...pick(rawInstance, ['key', 'entry']),
      name: rawInstance.name || component.name,
      parent: rawInstance.parentId,
      root: rawInstance.rootId,
      component,
      componentVersion: component.recentVersion,
      release,
      trackId: 0,
      solutionInstance
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
            'component', 'componentVersion', 'order', 'valueStruct'
          ]),
          componentInstance: newInstance,
          type: PropValueType.Instance
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

  // todo **id为componentInstanceId**
  async getRootDetail(instanceId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(instanceId, 'instanceId');
    const rootInstance = await em.findOne(ComponentInstance, instanceId, {
      populate: ['componentVersion', 'component',]
    });
    LogicException.assertNotFound(rootInstance, 'Instance', instanceId);
    if (rootInstance.root) {
      throw new LogicException(`当前组件不是入口组件`, LogicExceptionCode.UnExpect);
    }

    const entryExtensionInstanceList = await em.find(ExtensionInstance, {
      relationId: rootInstance.id,
      relationType: ExtensionRelationType.Entry
    }, { populate: ['extension', 'extensionVersion.propItemPipelineRaw'] })

    const solutionInstanceList = await em.find(SolutionInstance, {
      entry: rootInstance
    })

    for (const solutionInstance of solutionInstanceList) {
      solutionInstance.extensionInstanceList = await em.find(ExtensionInstance, {
        relationId: solutionInstance.solutionVersion.id,
        relationType: ExtensionRelationType.SolutionVersion
      }, { populate: ['extension', 'extensionVersion.propItemPipelineRaw'] })
    }

    rootInstance.groupList = await em.find(PropGroup, { component: rootInstance.component, componentVersion: rootInstance.componentVersion });
    rootInstance.blockList = await em.find(PropBlock, { component: rootInstance.component, componentVersion: rootInstance.componentVersion });
    rootInstance.itemList = await em.find(PropItem, { component: rootInstance.component, componentVersion: rootInstance.componentVersion });
    rootInstance.valueList = await em.find(PropValue, { componentInstance: rootInstance });
    rootInstance.stateList = await em.find(State, { release: rootInstance.release, $or: [{ componentInstance: rootInstance }, { componentInstance: null }] });

    const instanceList = await em.find(ComponentInstance, { root: instanceId }, {
      populate: ['component', 'componentVersion'],
    });

    for (let index = 0; index < instanceList.length; index++) {
      const instance = instanceList[index];

      instance.groupList = await em.find(PropGroup, { component: instance.component, componentVersion: instance.componentVersion });
      instance.blockList = await em.find(PropBlock, { component: instance.component, componentVersion: instance.componentVersion });
      instance.itemList = await em.find(PropItem, { component: instance.component, componentVersion: instance.componentVersion });
      instance.valueList = await em.find(PropValue, { componentInstance: instance });
    }

    const release = await em.findOne(Release, rootInstance.release.id)

    return { root: rootInstance, children: instanceList, release, entryExtensionInstanceList, solutionInstanceList };
  }

  async reverseDetectId(trackId: number, releaseId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(trackId, 'trackId');
    LogicException.assertParamEmpty(releaseId, 'releaseId');
    const instance = await em.findOne(ComponentInstance, { trackId, release: releaseId });

    return instance?.id;
  }

  async addChild(rawComponentInstace: ComponentInstance) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawComponentInstace.id, 'id');
    const parentInstance = await em.findOne(ComponentInstance, rawComponentInstace.id, { populate: ['component'] });
    LogicException.assertNotFound(parentInstance, 'componentInstance', rawComponentInstace.id);

    LogicException.assertParamEmpty(rawComponentInstace.componentId, 'componentId');
    const component = await em.findOne(Component, rawComponentInstace.componentId);
    LogicException.assertNotFound(component, 'component', rawComponentInstace.componentId);

    let newInstanceId: number;

    await em.begin();
    try {
      const rawInstance = {
        name: `${component.name}`,
        componentId: rawComponentInstace.componentId,
        releaseId: parentInstance.release.id,
        parentId: parentInstance.id,
        rootId: parentInstance.root?.id || parentInstance.id,
        solutionInstanceId: rawComponentInstace.solutionInstanceId
      } as ComponentInstance;

      const childInstance = await this.add(rawInstance, em);
      newInstanceId = childInstance.id;

      await em.commit();
    } catch (e) {
      await em.rollback();
      throw e;
    }

    const newInstance = await em.findOne(ComponentInstance, newInstanceId, {
      populate: ['componentVersion', 'component']
    });

    newInstance.groupList = await em.find(PropGroup, { component: newInstance.component, componentVersion: newInstance.componentVersion });
    newInstance.blockList = await em.find(PropBlock, { component: newInstance.component, componentVersion: newInstance.componentVersion });
    newInstance.itemList = await em.find(PropItem, { component: newInstance.component, componentVersion: newInstance.componentVersion });
    newInstance.valueList = await em.find(PropValue, { componentInstance: newInstance });

    return newInstance;
  }

  async remove(id: number, em = RequestContext.getEntityManager()) {
    let removeIds = [id];

    const instance = await em.findOne(ComponentInstance, id);

    LogicException.assertNotFound(instance, 'ComponentInstance', id);

    if (!instance.root) {
      const list = await em.find(ComponentInstance, { root: id });
      removeIds.push(...list.map(item => item.id));
    } else {
      let parentIds = [id];
      do {
        const instance = await em.findOne(ComponentInstance, parentIds.shift());
        const childList = await em.find(ComponentInstance, { parent: instance.id });
        childList.forEach((child) => {
          removeIds.push(child.id);
          parentIds.push(child.id);
        })
      } while (parentIds.length);
    }

    await em.nativeDelete(ComponentInstance, { id: { $in: removeIds } });
  }

  async list(releaseId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(releaseId, 'releaseId');
    const release = await em.findOne(Release, releaseId);
    LogicException.assertNotFound(release, 'release', releaseId);

    const instanceList = await em.find(ComponentInstance, { release, root: null });

    return instanceList
  }

  private async addRootForWrapper(rawInstance: ComponentInstance, wrapperRawInstance: ComponentInstance, em: EntityManager) {
    let wrapperInstance, childInstance;

    await em.begin();
    try {
      wrapperInstance = await this.add(wrapperRawInstance, em);

      const childRawInstance = {
        releaseId: rawInstance.releaseId,
        componentId: rawInstance.componentId,
        parentId: wrapperInstance.id,
        rootId: wrapperInstance.id
      } as ComponentInstance;
      childInstance = await this.add(childRawInstance, em);

      const rawContentValue = {
        setting: {},
        list: [{
          instanceId: childInstance.id,
          componentId: childInstance.component.id,
          componentName: childInstance.component.name
        }]
      } as PropMetadataComponent;

      const contentItem = await em.findOne(PropItem, {
        component: wrapperInstance.component,
        propKey: 'content'
      })

      const contentComponentValue = em.create(PropValue, {
        propItem: contentItem,
        component: wrapperInstance.component.id,
        componentVersion: wrapperInstance.component.recentVersion.id,
        componentInstance: wrapperInstance,
        type: PropValueType.Instance,
        valueStruct: ValueStruct.ChildComponentList,
        value: JSON.stringify(rawContentValue)
      });

      const titleItem = await em.findOne(PropItem, {
        component: wrapperInstance.component,
        propKey: 'title'
      })

      const titleComponentValue = em.create(PropValue, {
        propItem: titleItem,
        component: wrapperInstance.component.id,
        componentVersion: wrapperInstance.component.recentVersion.id,
        componentInstance: wrapperInstance,
        type: PropValueType.Instance,
        value: `"${rawInstance.name}"`
      });

      await em.persistAndFlush([contentComponentValue, titleComponentValue]);

      await em.commit();

      return wrapperInstance;
    } catch (e) {
      await em.rollback();

      if (wrapperInstance) {
        await this.remove(wrapperInstance.id, em);
      }

      if (childInstance) {
        await this.remove(childInstance.id, em);
      }

      throw e;
    }
  }
}



