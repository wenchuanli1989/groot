import { Entity, ManyToOne, OneToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { ExtensionVersion } from "./ExtensionVersion";
import { Organization } from "./Organization";
import { SoftDelete } from "../config/soft-delete";

@SoftDelete()
@Entity()
export class Extension extends BaseEntity {

  @Property({ length: 30 })
  name: string;

  @Property({ length: 30, comment: 'webpack模块联邦包名' })
  packageName = '';

  @Property({ length: 30, comment: 'webpack模块联邦模块名' })
  moduleName = '';

  @OneToOne({ serializer: value => value?.id, serializedName: 'recentVersionId', comment: '最新版本' })
  recentVersion?: ExtensionVersion;

  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'orgId' })
  org: Organization;
  //************************已下是接口入参或者查询返回需要定义的属性************************
}