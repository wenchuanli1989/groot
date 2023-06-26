import { ExtensionRelationType, pick } from '@grootio/common';
import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException, LogicExceptionCode } from 'config/logic.exception';
import { ComponentVersion } from 'entities/ComponentVersion';
import { ExtensionInstance } from 'entities/ExtensionInstance';
import { SolutionVersion } from 'entities/SolutionVersion';


@Injectable()
export class SolutionVersionService {

  async add(imageVersionId: number, name: string) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(imageVersionId, 'imageVersionId')
    LogicException.assertParamEmpty(name, 'name')

    const originSolutionVersion = await em.findOne(SolutionVersion, imageVersionId, { populate: ['componentVersionList'] })
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

    for (const componentVersion of originSolutionVersion.componentVersionList) {
      newSolutionVersion.componentVersionList.add(componentVersion)
    }

    const extInstanceList = await em.find(ExtensionInstance, {
      relationType: ExtensionRelationType.Solution,
      relationId: imageVersionId
    })

    await em.begin();
    try {
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

  async removeComponentVersion(solutionVersionId: number, componentVersionId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(solutionVersionId, 'solutionVersionId')
    LogicException.assertParamEmpty(componentVersionId, 'componentVersionId')

    const solutionVersion = await em.findOne(SolutionVersion, solutionVersionId, { populate: ['componentVersionList'] })
    LogicException.assertNotFound(solutionVersion, 'SolutionVersion', solutionVersionId);

    const componentVersion = await em.findOne(ComponentVersion, componentVersionId)
    LogicException.assertNotFound(solutionVersion, 'ComponentVersion', componentVersionId);

    solutionVersion.componentVersionList.remove(componentVersion)

    await em.flush()
  }
}



