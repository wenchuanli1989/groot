import { ExtensionRelationType } from '@grootio/common';
import { RequestContext, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException } from 'config/logic.exception';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { Solution } from 'entities/Solution';
import { SolutionVersion } from 'entities/SolutionVersion';


@Injectable()
export class SolutionService {

  async getDetail(rawSolution: Solution) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawSolution.id, 'solutionId');
    const solution = await em.findOne(Solution, rawSolution.id);
    LogicException.assertNotFound(solution, 'Solution', rawSolution.id);

    const solutionVersionId = rawSolution.solutionVersionId || solution.recentVersion.id
    const solutionVersion = await em.findOne(SolutionVersion, solutionVersionId)
    LogicException.assertNotFound(solutionVersion, 'SolutionVersion', solutionVersionId);

    solution.solutionVersion = wrap(solutionVersion).toObject() as any

    solution.extensionInstanceList = await em.find(ExtensionInstance, {
      relationType: ExtensionRelationType.SolutionVersion,
      relationId: solutionVersion.id
    }, { populate: ['extension', 'extensionVersion.propItemPipelineRaw'] })

    return solution;
  }

  async componentListByVersionId(solutionVersionId: number, all = false) {
    const em = RequestContext.getEntityManager();

    const solutionVersion = await em.findOne(SolutionVersion, solutionVersionId, { populate: ['componentVersionList.component'] });
    const componentList = solutionVersion.componentVersionList.getItems().filter(item => {
      if (all) {
        return true
      }

      return !!item.publish
    }).map(item => {
      item.component.componentVersionId = item.id;
      return item.component
    })

    return componentList;
  }
}



