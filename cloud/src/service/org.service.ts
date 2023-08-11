import { RequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LogicException } from 'config/logic.exception';
import { Organization } from 'entities/Organization';


@Injectable()
export class OrgService {

  async getDetail(orgId: number) {
    const em = RequestContext.getEntityManager();

    LogicException.assertParamEmpty(orgId, 'orgId');
    const org = await em.findOne(Organization, orgId);
    LogicException.assertNotFound(org, 'Organization', orgId);

    return org;
  }

}



