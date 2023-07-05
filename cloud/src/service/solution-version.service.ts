import { ExtensionRelationType, pick } from '@grootio/common';
import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException, LogicExceptionCode } from 'config/Logic.exception';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { SolutionComponent } from 'entities/SolutionComponent';
import { SolutionVersion } from 'entities/SolutionVersion';


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

    const originSolutionComponentRelation = await em.find(SolutionComponent, { solutionVersion: originSolutionVersion })
    const solutionComponentRelationMap = new Map<number, SolutionComponent>()
    const newSolutionComponentRelation = []
    for (const item of originSolutionComponentRelation) {
      const newSolutionComponent = em.create(SolutionComponent, pick(item, ['componentVersion', 'view', 'parent', 'component', 'solution'], { solutionVersion: newSolutionVersion }))
      solutionComponentRelationMap.set(item.id, newSolutionComponent)
      newSolutionComponentRelation.push(newSolutionComponent)
    }

    const extInstanceList = await em.find(ExtensionInstance, {
      relationType: ExtensionRelationType.Solution,
      relationId: imageVersionId
    })

    await em.begin();
    try {
      await em.flush()

      for (const solutionComponent of newSolutionComponentRelation) {
        if (solutionComponent.parent) {
          solutionComponent.parent = solutionComponentRelationMap.get(solutionComponent.parent.id)
        }
      }

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



