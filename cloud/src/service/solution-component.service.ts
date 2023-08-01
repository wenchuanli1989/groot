import { EntityManager, RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException, LogicExceptionCode } from 'config/Logic.exception';
import { ComponentVersion } from 'entities/ComponentVersion';
import { SolutionComponent } from 'entities/SolutionComponent';
import { SolutionVersion } from 'entities/SolutionVersion';
import { ComponentService } from './component.service';
import { SolutionComponentTagService } from './solution-component-tag.service';
import { TagNatureType } from '@grootio/common';
import { SolutionComponentTag } from 'entities/SolutionComponentTag';
import { SolutionInstance } from 'entities/SolutionInstance';

@Injectable()
export class SolutionComponentService {

  constructor(
    private componentService: ComponentService,
    private solutionComponentTagService: SolutionComponentTagService,
  ) { }

  async list(data: { solutionVersionId: number, queryVersionList: boolean, view: boolean, queryTagList: boolean }) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(data.solutionVersionId, 'solutionVersionId')
    const queryData = {
      solutionVersion: data.solutionVersionId,
    } as any

    if (data.view !== undefined) {
      queryData.view = data.view
    }
    const solutionComponentList = await em.find(SolutionComponent, queryData, { populate: ['component'] })

    for (const solutionComponent of solutionComponentList) {
      const { component } = solutionComponent
      // component.activeVersionId = solutionComponent.componentVersion.id
      if (data.queryVersionList) {
        component.versionList = await em.find(ComponentVersion, { component: solutionComponent.component })
      }
      if (data.queryTagList) {
        const allList = await em.find(SolutionComponentTag, { solutionComponent }, { populate: ['solutionTag'] })
        solutionComponent.markTagList = []
        solutionComponent.consumeTagList = []

        for (const item of allList) {
          if (item.type === TagNatureType.MakingTag) {
            solutionComponent.markTagList.push(item.solutionTag)
          } else {
            solutionComponent.consumeTagList.push(item.solutionTag)
          }
        }
      }
    }

    return solutionComponentList;
  }

  async listByViewVersionId(viewVersionId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(viewVersionId, 'viewVersionId')

    const solutionInstanceList = await em.find(SolutionInstance, { viewVersion: viewVersionId }, { orderBy: { primary: 'DESC' } })

    for (const solutionInstance of solutionInstanceList) {
      const solutionComponentList = await em.find(SolutionComponent, { solutionVersion: solutionInstance.solutionVersion }, { populate: ['component'] })
      solutionInstance.solutionComponentList = solutionComponentList
    }

    return solutionInstanceList;
  }

  async syncVersion(solutionVersionId: number, newSolutionComponentList: SolutionComponent[]) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(solutionVersionId, 'solutionVersionId')
    LogicException.assertParamEmpty(newSolutionComponentList, 'newSolutionComponentList')
    const solutionVersion = await em.findOne(SolutionVersion, solutionVersionId)
    LogicException.assertNotFound(solutionVersion, 'SolutionVersion', solutionVersionId)

    const newSolutionComponentMap = newSolutionComponentList.reduce((pre, curr) => {
      pre.set(curr.id, curr)
      return pre
    }, new Map())

    await em.begin()
    try {
      const solutionComponentList = await em.find(SolutionComponent, { solutionVersion: solutionVersionId })
      if (solutionComponentList.length !== newSolutionComponentList.length) {
        throw new LogicException(`数据总数不一致`, LogicExceptionCode.UnExpect)
      }

      for (const solutionComponent of solutionComponentList) {
        const newSolutionComponent = newSolutionComponentMap.get(solutionComponent.id)
        LogicException.assertNotFound(newSolutionComponent, 'SolutionComponent', solutionComponent.id)
        solutionComponent.componentVersion = newSolutionComponent.componentVersionId
      }

      await em.flush()

      await em.commit()
    } catch (e) {
      await em.rollback();
      throw e;
    }
  }

  async addComponent(rawSolutionComponent: SolutionComponent) {
    const em = RequestContext.getEntityManager();

    const rawComponent = rawSolutionComponent.component
    LogicException.assertParamEmpty(rawComponent, 'component');


    await em.begin();
    try {

      const component = await this.componentService.add(rawComponent, em)

      const solutionVersion = await em.findOne(SolutionVersion, rawSolutionComponent.solutionVersionId)

      const markTag = rawSolutionComponent.markTagList?.length > 0
      const consumeTag = rawSolutionComponent.consumeTagList?.length > 0

      const solutionComponent = em.create(SolutionComponent, {
        solutionVersion,
        componentVersion: component.componentVersion,
        component,
        view: consumeTag,
        solution: solutionVersion.solution
      })

      await em.flush()

      if (markTag) {
        await this.solutionComponentTagService.update(solutionComponent.id, rawSolutionComponent.markTagList.map(item => item.id), TagNatureType.MakingTag, em)
      }

      if (consumeTag) {
        await this.solutionComponentTagService.update(solutionComponent.id, rawSolutionComponent.consumeTagList.map(item => item.id), TagNatureType.ConsumeTag, em)
      }

      await em.commit()

      return solutionComponent;
    } catch (e) {
      await em.rollback();
      throw e;
    }
  }

  async remove(solutionComponentId: number, parentEm?: EntityManager) {
    let em = parentEm || RequestContext.getEntityManager();

    LogicException.assertParamEmpty(solutionComponentId, 'solutionComponentId')
    const solutionComponent = await em.findOne(SolutionComponent, solutionComponentId)
    LogicException.assertNotFound(solutionComponent, 'SolutionComponent', solutionComponentId)

    if (!parentEm) {
      await em.begin()
    }
    try {

      await this.solutionComponentTagService.update(solutionComponentId, [], TagNatureType.MakingTag, em)
      await this.solutionComponentTagService.update(solutionComponentId, [], TagNatureType.ConsumeTag, em)

      solutionComponent.deletedAt = new Date()

      await em.flush()

      const total = await em.count(SolutionComponent, { component: solutionComponent.component })
      if (total === 0) {
        await this.componentService.remove(solutionComponent.component.id, em)
      }

      if (!parentEm) {
        await em.commit()
      }

    } catch (e) {
      await em.rollback();
      throw e;
    }
  }
}



