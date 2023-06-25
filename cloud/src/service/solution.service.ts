import { ExtensionRelationType } from '@grootio/common';
import { RequestContext, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException } from 'config/logic.exception';
import { ComponentVersion } from 'entities/ComponentVersion';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { Solution } from 'entities/Solution';
import { SolutionVersion } from 'entities/SolutionVersion';


@Injectable()
export class SolutionService {

  async getDetailBySolutionVersionId(solutionVersionId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(solutionVersionId, 'solutionVersionId')

    const solutionVersion = await em.findOne(SolutionVersion, solutionVersionId)
    LogicException.assertNotFound(solutionVersion, 'SolutionVersion', solutionVersionId);

    const solution = await em.findOne(Solution, solutionVersion.solution.id);
    LogicException.assertNotFound(solution, 'Solution', solutionVersion.solution.id);

    solution.solutionVersion = wrap(solutionVersion).toObject() as any

    solution.extensionInstanceList = await em.find(ExtensionInstance, {
      relationType: ExtensionRelationType.Solution,
      relationId: solutionVersion.id,
      secret: false
    }, { populate: ['extension', 'extensionVersion.propItemPipelineRaw', 'extensionVersion.resourcePipelineRaw',] })

    return solution;
  }

  async componentListBySolutionVersionId(solutionVersionId: number, all = false, allVersion = false) {
    const em = RequestContext.getEntityManager();

    const solutionVersion = await em.findOne(SolutionVersion, solutionVersionId, { populate: ['componentVersionList.component'] });
    const componentList = solutionVersion.componentVersionList.getItems().filter(item => {
      return all || !!item.publish
    }).map(item => {
      item.component.componentVersionId = item.id;
      return item.component
    })

    if (allVersion) {
      for (let component of componentList) {
        component.versionList = await em.find(ComponentVersion, { component })
      }
    }

    return componentList;
  }
}



