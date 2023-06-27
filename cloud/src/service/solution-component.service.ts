import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException } from 'config/logic.exception';
import { ComponentVersion } from 'entities/ComponentVersion';
import { SolutionComponent } from 'entities/SolutionComponent';


@Injectable()
export class SolutionComponentService {

  async list(solutionVersionId: number, all = false, allVersion = false) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(solutionVersionId, 'solutionVersionId')
    const solutionComponentList = await em.find(SolutionComponent, { solutionVersion: solutionVersionId }, { populate: ['componentVersion.component'] })
    const componentList = solutionComponentList.filter(item => all || !!item.componentVersion.publish).map(item => {
      item.componentVersion.component.activeVersionId = item.componentVersion.id
      return item.componentVersion.component
    })

    if (allVersion) {
      for (let component of componentList) {
        component.versionList = await em.find(ComponentVersion, { component })
      }
    }

    return componentList;
  }

}



