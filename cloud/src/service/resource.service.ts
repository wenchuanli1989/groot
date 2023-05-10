import { pick } from '@grootio/common';
import { FilterQuery, RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException, LogicExceptionCode } from 'config/logic.exception';
import { ComponentInstance } from 'entities/ComponentInstance';
import { Resource } from 'entities/Resource';


@Injectable()
export class ResourceService {

  async add(rawResource: Resource) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawResource.name, 'name');
    LogicException.assertParamEmpty(rawResource.releaseId, 'releaseId');

    const release = await em.findOne(ComponentInstance, rawResource.releaseId);
    LogicException.assertNotFound(release, 'Release', rawResource.releaseId);
    let instance;
    if (rawResource.instanceId) {
      instance = await em.findOne(ComponentInstance, { id: rawResource.instanceId, release });
      LogicException.assertNotFound(instance, 'ComponentInstance', `id = ${rawResource.instanceId} and releaseId = ${release.id}`);
    }

    const query: FilterQuery<Resource> = {
      name: rawResource.name,
      release,
    }
    if (rawResource.instanceId) {
      query.$or = [
        { componentInstance: instance },
        { componentInstance: null }
      ]
    }
    const resourceUnique = await em.count(Resource, query);
    if (resourceUnique > 0) {
      throw new LogicException('名称重复', LogicExceptionCode.NotUnique);
    }

    const newResource = em.create(Resource, {
      ...pick(rawResource, ['name', 'type', 'value']),
      release,
      componentInstance: instance
    });

    await em.flush();

    return newResource;
  }

  async remove(resourceId: number) {
    const em = RequestContext.getEntityManager();

    await em.nativeDelete(Resource, { id: resourceId });
  }

  async update(rawResource: Resource) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(rawResource.id, 'id');
    const resource = await em.findOne(Resource, rawResource.id);
    LogicException.assertNotFound(resource, 'Resource', rawResource.id);

    if (!!rawResource.name && rawResource.name !== resource.name) {
      const query: FilterQuery<Resource> = {
        name: rawResource.name,
        release: resource.release,
      }
      if (rawResource.instanceId) {
        query.$or = [
          { componentInstance: resource.componentInstance },
          { componentInstance: null }
        ]
      }
      const resourceUnique = await em.count(Resource, query);

      if (resourceUnique > 0) {
        throw new LogicException('名称重复', LogicExceptionCode.NotUnique);
      }
    }

    pick(rawResource, ['name', 'value', 'type'], resource);

    await em.flush();

    return resource;
  }
}



