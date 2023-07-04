import { ExtensionRelationType } from "@grootio/common";
import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { Extension } from "./Extension";
import { ExtensionVersion } from "./ExtensionVersion";
import { SoftDelete } from "../config/soft-delete";

@SoftDelete()
@Entity()
export class ExtensionInstance extends BaseEntity {

  @ManyToOne()
  extensionVersion: ExtensionVersion;

  // @todo 考虑去json，改为结构化
  @Property({ length: 1000 })
  config: string;

  @Property({ type: 'tinyint' })
  relationType: ExtensionRelationType;

  @Property()
  relationId: number;

  /**
   * 是否是隐藏插件
   */
  @Property()
  secret = false;

  // todo
  @Property()
  open = true;

  /**
   * 必要领域归属字段
   */
  @ManyToOne()
  extension: Extension;
  //************************已下是接口入参或者查询返回需要定义的属性************************
}