import { ExtensionRelationType } from '@grootio/common';
import { RequestContext, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException, LogicExceptionCode } from 'config/logic.exception';
import { AppResource } from 'entities/AppResource';
import { Application } from 'entities/Application';
import { ComponentInstance } from 'entities/ComponentInstance';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { Release } from 'entities/Release';
import { parseResource } from 'util/common';


@Injectable()
export class ApplicationService {

  async getDetailByReleaseId(releaseId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(releaseId, '参数releaseId为空')

    const release = await em.findOne(Release, releaseId)
    LogicException.assertNotFound(release, 'Release', releaseId);
    const app = await em.findOne(Application, release.application.id)
    LogicException.assertNotFound(app, 'Application', release.application.id);

    app.release = wrap(release).toObject()
    app.extensionInstanceList = await em.find(ExtensionInstance, {
      relationId: releaseId,
      relationType: ExtensionRelationType.Application
    }, { populate: ['extension', 'extensionVersion.propItemPipelineRaw', 'extensionVersion.resourcePipelineRaw'] })

    let resourceList = await em.find(AppResource, { app, release }, { populate: ['imageResource.resourceConfig', 'resourceConfig'] })

    const resourceConfigMap = new Map()
    app.resourceList = resourceList.map(resource => {
      return parseResource(resource, resourceConfigMap) as any as AppResource
    })
    app.resourceConfigList = [...resourceConfigMap.values()]

    app.entryList = await em.find(ComponentInstance, { release, entry: true });

    return app;
  }

}



