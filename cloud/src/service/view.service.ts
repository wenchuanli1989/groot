import { ExtensionRelationType, pick } from '@grootio/common';
import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException, LogicExceptionCode } from 'config/Logic.exception';
import { ComponentInstance } from 'entities/ComponentInstance';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { PropBlock } from 'entities/PropBlock';
import { PropGroup } from 'entities/PropGroup';
import { PropItem } from 'entities/PropItem';
import { PropValue } from 'entities/PropValue';
import { Release } from 'entities/Release';
import { SolutionInstance } from 'entities/SolutionInstance';
import { ViewResource } from 'entities/ViewResource';
import { ComponentInstanceService } from './component-instance.service';
import { View } from 'entities/View';
import { parseResource } from '../util/common';
import { SolutionComponent } from 'entities/SolutionComponent';


@Injectable()
export class ViewService {

  constructor(
    private componentInstanceService: ComponentInstanceService,
  ) { }

  // todo **id为componentInstanceId**
  async getDetailByViewIdAndReleaseId(viewId: number, releaseId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(viewId, 'viewId');
    LogicException.assertParamEmpty(releaseId, 'releaseId');

    const release = await em.findOne(Release, releaseId)
    LogicException.assertNotFound(release, 'Release', releaseId);

    const view = await em.findOne(View, viewId)
    LogicException.assertNotFound(view, 'View', viewId);

    const viewExtensionInstanceList = await em.find(ExtensionInstance, {
      relationId: viewId,
      relationType: ExtensionRelationType.View,
      secret: false
    }, { populate: ['extension', 'extensionVersion.propItemPipelineRaw', 'extensionVersion.resourcePipelineRaw',] })

    const solutionInstanceList = await em.find(SolutionInstance, { view, release })

    for (const solutionInstance of solutionInstanceList) {
      solutionInstance.extensionInstanceList = await em.find(ExtensionInstance, {
        relationId: solutionInstance.solutionVersion.id,
        relationType: ExtensionRelationType.Solution,
        secret: false
      }, { populate: ['extension', 'extensionVersion.propItemPipelineRaw', 'extensionVersion.resourcePipelineRaw',] })
    }

    const instanceList = await em.find(ComponentInstance, { view }, {
      populate: ['component', 'componentVersion'],
    });

    for (let index = 0; index < instanceList.length; index++) {
      const instance = instanceList[index];

      instance.groupList = await em.find(PropGroup, { component: instance.component, componentVersion: instance.componentVersion });
      instance.blockList = await em.find(PropBlock, { component: instance.component, componentVersion: instance.componentVersion });
      instance.itemList = await em.find(PropItem, { component: instance.component, componentVersion: instance.componentVersion });
      instance.valueList = await em.find(PropValue, { componentInstance: instance });
    }

    let resourceList = await em.find(ViewResource, { view }, { populate: ['imageResource.resourceConfig', 'resourceConfig'] })

    const resourceConfigMap = new Map()
    resourceList = resourceList.map(resource => {
      return parseResource(resource, resourceConfigMap) as any as ViewResource
    })
    const resourceConfigList = [...resourceConfigMap.values()]

    return { ...view, instanceList, resourceList, resourceConfigList, viewExtensionInstanceList, solutionInstanceList };
  }

  async add(rawView: View) {
    let em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawView.key, 'key');
    LogicException.assertParamEmpty(rawView.name, 'name');
    LogicException.assertParamEmpty(rawView.releaseId, 'releaseId');
    LogicException.assertParamEmpty(rawView.solutionComponentId, 'solutionComponentId');

    const release = await em.findOne(Release, rawView.releaseId, { populate: ['app', 'project'] });
    LogicException.assertNotFound(release, 'Release', rawView.releaseId);

    const solutionComponent = await em.findOne(SolutionComponent, rawView.solutionComponentId);
    LogicException.assertNotFound(solutionComponent, 'SolutionComponent', rawView.solutionComponentId);

    const keySameCount = await em.count(View, { release, key: rawView.key })

    if (keySameCount > 0) {
      throw new LogicException(`参数key冲突，该值必须全局唯一`, LogicExceptionCode.NotUnique);
    }

    const view = em.create(View, pick(rawView, ['key', 'name', 'primaryView'], { release, app: release.app, project: release.project }))

    await em.begin()
    try {
      await em.flush()

      const solutionInstance = em.create(SolutionInstance, {
        solutionVersion: solutionComponent.solutionVersion.id,
        view,
        primary: true,
        release,
        solution: solutionComponent.solution.id,
        app: release.app,
        project: release.project
      })

      await em.flush()

      await this.componentInstanceService.add({
        solutionInstanceId: solutionInstance.id,
        solutionComponentId: rawView.solutionComponentId
      }, em);

      await em.commit()
      return view
    } catch (e) {
      await em.rollback();
      throw e;
    }
  }

  async remove(viewId: number) {
    let em = RequestContext.getEntityManager();

    const view = await em.findOne(View, viewId, { populate: ['app', 'project'] });
    LogicException.assertNotFound(view, 'View', viewId);

    await em.begin()

    try {
      view.deletedAt = new Date()

      await em.nativeUpdate(ComponentInstance, { view }, { deletedAt: new Date() });

      await em.nativeUpdate(PropValue, { view }, { deletedAt: new Date() });

      await em.commit()
    } catch (e) {
      await em.rollback()
      throw e
    }
  }
}



