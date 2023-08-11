import { ExtensionRelationType, pick } from '@grootio/common';
import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException, LogicExceptionCode } from 'config/logic.exception';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { SolutionComponent } from 'entities/SolutionComponent';
import { SolutionVersion } from 'entities/SolutionVersion';
import { SolutionComponentTag } from 'entities/SolutionComponentTag';


@Injectable()
export class SolutionVersionService {

  async add(imageVersionId: number, name: string) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(imageVersionId, 'imageVersionId')
    LogicException.assertParamEmpty(name, 'name')

    const originSolutionVersion = await em.findOne(SolutionVersion, imageVersionId)
    LogicException.assertNotFound(originSolutionVersion, 'SolutionVersion', imageVersionId);

    const sameNameCount = await em.count(SolutionVersion, {
      solution: originSolutionVersion.solution,
      name
    })

    if (sameNameCount > 0) {
      throw new LogicException('名称重复', LogicExceptionCode.NotUnique)
    }

    const _newSolutionVersion = pick(originSolutionVersion, ['solution', 'playgroundPath', 'debugBaseUrl'])
    _newSolutionVersion.name = name

    const newSolutionVersion = em.create(SolutionVersion, _newSolutionVersion)

    const originSolutionComponentList = await em.find(SolutionComponent, { solutionVersion: originSolutionVersion })
    const solutionComponentRelationMap = new Map<number, SolutionComponent>()
    for (const item of originSolutionComponentList) {
      const newSolutionComponent = em.create(SolutionComponent, pick(item, ['componentVersion', 'view', 'component', 'solution'], { solutionVersion: newSolutionVersion }))
      solutionComponentRelationMap.set(item.id, newSolutionComponent)
    }

    const extInstanceList = await em.find(ExtensionInstance, {
      relationType: ExtensionRelationType.Solution,
      relationId: imageVersionId
    })

    await em.begin();
    try {
      await em.flush()

      for (const originSolutionComponent of originSolutionComponentList) {
        const newSolutionComponent = solutionComponentRelationMap.get(originSolutionComponent.id)
        const list = await em.find(SolutionComponentTag, { solutionComponent: originSolutionComponent })

        for (const item of list) {
          em.create(SolutionComponentTag, {
            solutionComponent: newSolutionComponent,
            solutionTag: item.solutionTag,
            type: item.type
          })
        }
      }

      await em.flush()

      for (const extInstance of extInstanceList) {
        const _extInstance = pick(extInstance, ['extension', 'extensionVersion', 'config', 'relationType', 'secret', 'open'])
        _extInstance.relationId = newSolutionVersion.id
        em.create(ExtensionInstance, _extInstance)
      }

      await em.flush()

      await em.commit()
    } catch (e) {
      await em.rollback();
      throw e;
    }

    return newSolutionVersion
  }

}



