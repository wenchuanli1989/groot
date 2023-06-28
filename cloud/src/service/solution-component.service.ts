import { RequestContext, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException } from 'config/logic.exception';
import { ComponentVersion } from 'entities/ComponentVersion';
import { SolutionComponent } from 'entities/SolutionComponent';

@Injectable()
export class SolutionComponentService {

  async list(solutionVersionId: number, allVersion = false, entry: boolean) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(solutionVersionId, 'solutionVersionId')
    const queryData = {
      solutionVersion: solutionVersionId,
    } as any

    if (entry !== undefined) {
      queryData.entry = entry
    }
    const solutionComponentList = await em.find(SolutionComponent, queryData, { populate: ['componentVersion.component', 'parent.component'] })

    const componentList = solutionComponentList.map(item => {
      const component = item.componentVersion.component
      component.activeVersionId = item.componentVersion.id
      component.parentComponentId = item.parent?.component?.id

      return component
    })

    if (allVersion) {
      for (let component of componentList) {
        component.versionList = await em.find(ComponentVersion, { component })
      }
    }

    return componentList;
  }

}



