import { ExtensionRelationType, StudioMode } from '@grootio/common';
import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException } from 'config/logic.exception';
import { ExtensionInstance } from 'entities/ExtensionInstance';


@Injectable()
export class ExtensionInstanceService {

  async getSecret({ mode, releaseId, solutionVersionId }: { mode: StudioMode, releaseId: number, solutionVersionId: number }) {
    const relationType = mode === StudioMode.Prototype ? ExtensionRelationType.Solution : ExtensionRelationType.Application;
    if (mode === StudioMode.Prototype) {
      LogicException.assertParamEmpty(solutionVersionId, 'solutionVersionId');
    } else {
      LogicException.assertParamEmpty(releaseId, 'releaseId');
    }
    const relationId = mode === StudioMode.Prototype ? solutionVersionId : releaseId;

    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(relationId, 'relationId');
    const extInstance = await em.findOne(ExtensionInstance, { relationId, relationType, secret: true }, { populate: ['extension', 'extensionVersion'] });
    LogicException.assertNotFound(extInstance, 'ExtensionInstance', `relationId:${relationId},relationType:${relationType},secret:true}`);

    return extInstance;
  }

}



