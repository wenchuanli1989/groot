import { ExtensionRelationType } from '@grootio/common';
import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException } from 'config/logic.exception';
import { AppResource } from 'entities/AppResource';
import { Application } from 'entities/Application';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { Release } from 'entities/Release';
import { parseResource } from 'util/common';


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
      relationType: ExtensionRelationType.Application
    }, { populate: ['extension', 'extensionVersion.propItemPipelineRaw', 'extensionVersion.resourcePipelineRaw'] })

    let resourceList = await em.find(AppResource, { app: application, release }, { populate: ['imageResource.resourceConfig', 'resourceConfig'] })

    const resourceConfigMap = new Map()
    application.resourceList = resourceList.map(resource => {
      return parseResource(resource, resourceConfigMap) as any as AppResource
    })
    application.resourceConfigList = [...resourceConfigMap.values()]

    return application;
  }

}



