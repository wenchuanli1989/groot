import { pick } from '@grootio/common';
import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException, LogicExceptionCode } from 'config/Logic.exception';
import { AppResource } from 'entities/AppResource';
import { Application } from 'entities/Application';
import { ComponentInstance } from 'entities/ComponentInstance';
import { ViewResource } from 'entities/ViewResource';
import { ProjectResource } from 'entities/ProjectResource';
import { Release } from 'entities/Release';
import { ResourceConfig } from 'entities/ResourceConfig';
import { View } from 'entities/View';


@Injectable()
export class ResourceService {

  async addViewResource(rawResource: ViewResource) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawResource.viewId, 'viewId');
    LogicException.assertParamEmpty(rawResource.releaseId, 'releaseId');
    LogicException.assertParamEmpty(rawResource.namespace, 'namespace');
    LogicException.assertParamEmpty(rawResource.name, 'name');
    LogicException.assertParamEmpty(rawResource.value, 'value');

    const release = await em.findOne(ComponentInstance, rawResource.releaseId);
    LogicException.assertNotFound(release, 'Release', rawResource.releaseId);
    const view = await em.findOne(View, { id: rawResource.viewId, release });
    LogicException.assertNotFound(view, 'View', `id = ${rawResource.viewId} and releaseId = ${release.id}`);

    const resourceUnique = await em.count(ViewResource, {
      name: rawResource.name,
      namespace: rawResource.namespace,
      release,
      view
    });

    if (resourceUnique > 0) {
      throw new LogicException('名称重复', LogicExceptionCode.NotUnique);
    }

    let resourceConfig, imageResource;
    if (rawResource.resourceConfigId) {
      resourceConfig = await em.findOne(ResourceConfig, rawResource.resourceConfigId)
    }
    if (rawResource.imageResourceId) {
      imageResource = await em.findOne(ProjectResource, rawResource.imageResourceId)
    }

    const newResource = em.create(ViewResource, {
      ...pick(rawResource, ['namespace', 'name', 'type', 'value']),
      release,
      view,
      resourceConfig,
      imageResource,
      app: view.app,
      project: view.project
    });

    await em.flush();

    return newResource;
  }

  async addAppResource(rawResource: AppResource) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawResource.appId, 'appId');
    LogicException.assertParamEmpty(rawResource.releaseId, 'releaseId');
    LogicException.assertParamEmpty(rawResource.namespace, 'namespace');
    LogicException.assertParamEmpty(rawResource.name, 'name');
    LogicException.assertParamEmpty(rawResource.value, 'value');

    const app = await em.findOne(Application, rawResource.appId);
    LogicException.assertNotFound(app, 'Application', rawResource.appId);
    const release = await em.findOne(Release, rawResource.releaseId);
    LogicException.assertNotFound(release, 'Release', rawResource.releaseId);

    const resourceUnique = await em.count(AppResource, {
      name: rawResource.name,
      namespace: rawResource.namespace,
      app
    });

    if (resourceUnique > 0) {
      throw new LogicException('名称重复', LogicExceptionCode.NotUnique);
    }

    let resourceConfig, imageResource;
    if (rawResource.resourceConfigId) {
      resourceConfig = await em.findOne(ResourceConfig, rawResource.resourceConfigId)
    }
    if (rawResource.imageResourceId) {
      imageResource = await em.findOne(ProjectResource, rawResource.imageResourceId)
    }

    const newResource = em.create(AppResource, {
      ...pick(rawResource, ['namespace', 'name', 'type', 'value']),
      app,
      release,
      resourceConfig,
      imageResource,
    });

    await em.flush();

    return newResource;
  }

  async remove(resourceId: number, type: 'app' | 'instance' | 'project') {
    const em = RequestContext.getEntityManager();

    if (type === 'app') {
      await em.nativeUpdate(AppResource, { id: resourceId }, { deletedAt: new Date() })
    } else if (type === 'instance') {
      await em.nativeUpdate(ViewResource, { id: resourceId }, { deletedAt: new Date() })
    } else {
      await em.nativeUpdate(ProjectResource, { id: resourceId }, { deletedAt: new Date() })
    }
  }

  async updateViewResource(rawResource: ViewResource) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawResource.name, 'name');
    LogicException.assertParamEmpty(rawResource.value, 'value');

    LogicException.assertParamEmpty(rawResource.id, 'id');
    const resource = await em.findOne(ViewResource, rawResource.id);
    LogicException.assertNotFound(resource, 'ViewResource', rawResource.id);

    if (!!rawResource.name && rawResource.name !== resource.name) {
      const resourceUnique = await em.count(ViewResource, {
        name: rawResource.name,
        namespace: resource.namespace,
        release: resource.release,
        view: resource.view
      });

      if (resourceUnique > 0) {
        throw new LogicException('名称重复', LogicExceptionCode.NotUnique);
      }
    }

    pick(rawResource, ['name', 'value', 'type'], resource);

    await em.flush();

    return resource;
  }

  async updateAppResource(rawResource: AppResource) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawResource.name, 'name');
    LogicException.assertParamEmpty(rawResource.value, 'value');

    LogicException.assertParamEmpty(rawResource.id, 'id');
    const resource = await em.findOne(AppResource, rawResource.id);
    LogicException.assertNotFound(resource, 'AppResource', rawResource.id);

    if (!!rawResource.name && rawResource.name !== resource.name) {
      const resourceUnique = await em.count(AppResource, {
        name: rawResource.name,
        namespace: resource.namespace,
        release: resource.release,
        app: resource.app
      });

      if (resourceUnique > 0) {
        throw new LogicException('名称重复', LogicExceptionCode.NotUnique);
      }
    }

    pick(rawResource, ['name', 'value', 'type'], resource);

    await em.flush();

    return resource;
  }
}



