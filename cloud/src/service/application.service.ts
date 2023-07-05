import { ExtensionRelationType } from '@grootio/common';
import { RequestContext, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException } from 'config/Logic.exception';
import { AppResource } from 'entities/AppResource';
import { Application } from 'entities/Application';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { Release } from 'entities/Release';
import { View } from 'entities/View';
import { parseResource } from 'util/common';


@Injectable()
export class ApplicationService {

  async getDetailByReleaseId(releaseId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(releaseId, '参数releaseId为空')

    const release = await em.findOne(Release, releaseId)
    LogicException.assertNotFound(release, 'Release', releaseId);
    const app = await em.findOne(Application, release.app.id)
    LogicException.assertNotFound(app, 'Application', release.app.id);

    app.release = wrap(release).toObject()
    app.extensionInstanceList = await em.find(ExtensionInstance, {
      relationId: releaseId,
      relationType: ExtensionRelationType.Application,
      secret: false
    }, { populate: ['extension', 'extensionVersion.propItemPipelineRaw', 'extensionVersion.resourcePipelineRaw'] })

    let resourceList = await em.find(AppResource, { app, release }, { populate: ['imageResource.resourceConfig', 'resourceConfig'] })

    const resourceConfigMap = new Map()
    app.resourceList = resourceList.map(resource => {
      return parseResource(resource, resourceConfigMap) as any as AppResource
    })
    app.resourceConfigList = [...resourceConfigMap.values()]

    app.viewList = await em.find(View, { release });

    return app;
  }

}



