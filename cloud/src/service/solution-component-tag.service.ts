import { TagNatureType } from '@grootio/common';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { SolutionComponentTag } from 'entities/SolutionComponentTag';


@Injectable()
export class SolutionComponentTagService {

  async update(solutionComponentId: number, solutionTagIds: number[], type: TagNatureType, parentEm?: EntityManager) {
    const em = parentEm || RequestContext.getEntityManager();

    if (!parentEm) {
      await em.begin()
    }
    try {

      await em.nativeDelete(SolutionComponentTag, { solutionComponent: solutionComponentId })

      await em.flush()

      for (const solutionTagId of solutionTagIds) {
        em.create(SolutionComponentTag, {
          solutionComponent: solutionComponentId,
          solutionTag: solutionTagId,
          type
        })
      }

      await em.flush()

      if (!parentEm) {
        await em.commit()
      }
    } catch (e) {
      await em.rollback();
      throw e;
    }
  }

}



