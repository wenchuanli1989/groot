import { PropBlockLayout, PropBlockStructType } from "@grootio/common";
import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { Component } from "./Component";
import { ComponentVersion } from "./ComponentVersion";
import { PropGroup } from "./PropGroup";
import { SoftDelete } from "../config/soft-delete";

@SoftDelete()
@Entity()
export class PropBlock extends BaseEntity {

  @Property({ length: 20 })
  name: string;

  /**
   * 是否是组件根属性，如果为true则不会继承父级配置组
   */
  @Property()
  rootPropKey = false;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'groupId' })
  group: PropGroup;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'componentId' })
  component: Component;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'componentVersionId' })
  componentVersion: ComponentVersion;

  @Property({ type: 'tinyint' })
  layout: PropBlockLayout = PropBlockLayout.Horizontal;

  @Property({ type: 'tinyint' })
  struct: PropBlockStructType = PropBlockStructType.Default;

  @Property({ columnType: 'double' })
  order: number;

  // @todo 考虑去json，改为结构化
  @Property({ length: 500 })
  listStructData = '';

  /**
   * 组件属性，其下配置项默认继承该属性
   */
  @Property({ length: 20 })
  propKey = '';

  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  groupId?: number;
}