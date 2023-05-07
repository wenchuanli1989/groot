import { ExtensionRelationType } from '@grootio/common';
import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException } from 'config/logic.exception';
import { Application } from 'entities/Application';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { Release } from 'entities/Release';
import { Resource } from 'entities/Resource';


@Injectable()
export class ApplicationService {

  async getDetail(rawApplication: Application) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawApplication.id, 'applicationId');
    const application = await em.findOne(Application, rawApplication.id);
    LogicException.assertNotFound(application, 'application', rawApplication.id);

    const releaseId = rawApplication.releaseId || application.devRelease.id
    const release = await em.findOne(Release, releaseId)
    LogicException.assertNotFound(release, 'Release', releaseId);

    application.extensionInstanceList = await em.find(ExtensionInstance, {
      relationId: releaseId,
      relationType: ExtensionRelationType.Release
    }, { populate: ['extension', 'extensionVersion.propItemPipelineRaw', 'extensionVersion'] })

    application.resourceList = await em.find(Resource, { componentInstance: null })

    return application;
  }

}



