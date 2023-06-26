import { ExtensionRelationType } from "@grootio/common";
import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { Extension } from "./Extension";
import { ExtensionVersion } from "./ExtensionVersion";

@Entity()
export class ExtensionInstance extends BaseEntity {

  @ManyToOne()
  extension: Extension;

  @ManyToOne()
  extensionVersion: ExtensionVersion;

  // @todo 考虑去json，改为结构化
  @Property({ length: 1000 })
  config: string;

  @Property({ type: 'tinyint' })
  relationType: ExtensionRelationType;

  @Property()
  relationId: number;

  @Property()
  secret = false;

  @Property()
  open = true;

  //************************已下是接口入参或者查询返回需要定义的属性************************
}