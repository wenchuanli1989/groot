import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import { DeployStatusType, EnvType } from "@grootio/common";

import { Application } from "./Application";
import { BaseEntity } from "./BaseEntity";
import { Bundle } from "./Bundle";
import { Release } from "./Release";
import { SoftDelete } from "../config/soft-delete";
import { Project } from "./Project";

@SoftDelete()
@Entity()
export class Deploy extends BaseEntity {

  @ManyToOne({ serializer: value => value?.id, serializedName: 'releaseId' })
  release: Release;

  @Property({ type: 'tinyint' })
  env: EnvType;

  @Property({ type: 'tinyint' })
  status: DeployStatusType;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'bundleId' })
  bundle: Bundle;

  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'appId' })
  app: Application

  @ManyToOne({ serializer: value => value?.id, serializedName: 'projectId' })
  project: Project;
  //************************已下是接口入参或者查询返回需要定义的属性************************

  // @Property({ persist: false })
  // bundleId?: number
}
