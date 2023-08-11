import { ExtensionRelationType } from '@grootio/common';
import { RequestContext, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException } from 'config/logic.exception';
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

    solution.versionList = await em.find(SolutionVersion, { solution })

    solution.extensionInstanceList = await em.find(ExtensionInstance, {
      relationType: ExtensionRelationType.Solution,
      relationId: solutionVersion.id,
      secret: false
    }, { populate: ['extension', 'extensionVersion.propItemPipelineRaw', 'extensionVersion.resourcePipelineRaw',] })

    return solution;
  }

}



