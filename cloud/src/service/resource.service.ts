import { pick } from '@grootio/common';
import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException, LogicExceptionCode } from 'config/logic.exception';
import { AppResource } from 'entities/AppResource';
import { Application } from 'entities/Application';
import { ComponentInstance } from 'entities/ComponentInstance';
import { InstanceResource } from 'entities/InstanceResource';
import { ProjectResource } from 'entities/ProjectResource';
import { Release } from 'entities/Release';
import { ResourceConfig } from 'entities/ResourceConfig';


@Injectable()
export class ResourceService {

  async addInstanceResource(rawResource: InstanceResource) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawResource.componentInstanceId, 'componentInstanceId');
    LogicException.assertParamEmpty(rawResource.releaseId, 'releaseId');
    LogicException.assertParamEmpty(rawResource.namespace, 'namespace');
    LogicException.assertParamEmpty(rawResource.name, 'name');
    LogicException.assertParamEmpty(rawResource.value, 'value');

    const release = await em.findOne(ComponentInstance, rawResource.releaseId);
    LogicException.assertNotFound(release, 'Release', rawResource.releaseId);
    const instance = await em.findOne(ComponentInstance, { id: rawResource.componentInstanceId, release });
    LogicException.assertNotFound(instance, 'ComponentInstance', `id = ${rawResource.componentInstanceId} and releaseId = ${release.id}`);

    const resourceUnique = await em.count(InstanceResource, {
      name: rawResource.name,
      namespace: rawResource.namespace,
      release,
      componentInstance: instance
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

    const newResource = em.create(InstanceResource, {
      ...pick(rawResource, ['namespace', 'name', 'type', 'value']),
      release,
      componentInstance: instance,
      resourceConfig,
      imageResource
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
      imageResource
    });

    await em.flush();

    return newResource;
  }

  async remove(resourceId: number, type: 'app' | 'instance' | 'project') {
    const em = RequestContext.getEntityManager();

    if (type === 'app') {
      await em.nativeUpdate(AppResource, { id: resourceId }, { deletedAt: new Date() })
    } else if (type === 'instance') {
      await em.nativeUpdate(InstanceResource, { id: resourceId }, { deletedAt: new Date() })
    } else {
      await em.nativeUpdate(ProjectResource, { id: resourceId }, { deletedAt: new Date() })
    }
  }

  async updateInstanceResource(rawResource: InstanceResource) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawResource.name, 'name');
    LogicException.assertParamEmpty(rawResource.value, 'value');

    LogicException.assertParamEmpty(rawResource.id, 'id');
    const resource = await em.findOne(InstanceResource, rawResource.id);
    LogicException.assertNotFound(resource, 'InstanceResource', rawResource.id);

    if (!!rawResource.name && rawResource.name !== resource.name) {
      const resourceUnique = await em.count(InstanceResource, {
        name: rawResource.name,
        namespace: resource.namespace,
        release: resource.release,
        componentInstance: resource.componentInstance
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



