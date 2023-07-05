import { EntityManager, RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException, LogicExceptionCode } from 'config/Logic.exception';
import { ComponentVersion } from 'entities/ComponentVersion';
import { SolutionComponent } from 'entities/SolutionComponent';
import { SolutionVersion } from 'entities/SolutionVersion';
import { ComponentService } from './component.service';

@Injectable()
export class SolutionComponentService {

  constructor(
    private componentService: ComponentService,
  ) { }

  async list(solutionVersionId: number, allVersion = false, view: boolean) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(solutionVersionId, 'solutionVersionId')
    const queryData = {
      solutionVersion: solutionVersionId,
    } as any

    if (view !== undefined) {
      queryData.view = view
    }
    const solutionComponentList = await em.find(SolutionComponent, queryData, { populate: ['component'] })

    for (const solutionComponent of solutionComponentList) {
      const { component } = solutionComponent
      // component.activeVersionId = solutionComponent.componentVersion.id
      if (allVersion) {
        component.versionList = await em.find(ComponentVersion, { component: solutionComponent.component })
      }
    }

    return solutionComponentList;
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

    let parentSolutionComponent
    if (rawSolutionComponent.parentId) {
      parentSolutionComponent = await em.findOne(SolutionComponent, rawSolutionComponent.parentId)
      LogicException.assertNotFound(parentSolutionComponent, 'SolutionComponent', rawSolutionComponent.parentId);
    }


    await em.begin();
    try {

      const component = await this.componentService.add(rawComponent, em)

      const solutionVersion = await em.findOne(SolutionVersion, rawComponent.solutionVersionId)

      const solutionComponent = em.create(SolutionComponent, {
        solutionVersion,
        componentVersion: component.componentVersion,
        component,
        view: !!parentSolutionComponent,
        parent: parentSolutionComponent,
        solution: solutionVersion.solution
      })

      await em.flush()

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

    const children = await em.find(SolutionComponent, { parent: solutionComponent })


    const parentCtx = parentEm ? em.getTransactionContext() : undefined;
    await em.begin()
    try {

      if (children.length) {
        for (const subSolutionComponent of children) {
          await this.remove(subSolutionComponent.id, em)
        }
      }

      solutionComponent.deletedAt = new Date()

      await em.flush()

      const total = await em.count(SolutionComponent, { component: solutionComponent.component })
      if (total === 0) {
        await this.componentService.remove(solutionComponent.component.id, em)
      }

      await em.commit()

    } catch (e) {
      await em.rollback();
      throw e;
    } finally {
      if (parentCtx) {
        em.setTransactionContext(parentCtx);
      }
    }
  }
}



