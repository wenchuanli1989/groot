import { Entity, Enum, ManyToOne, Property } from "@mikro-orm/core";
import { PropValueType, ValueStruct } from "@grootio/common";

import { BaseEntity } from "./BaseEntity";
import { ComponentInstance } from "./ComponentInstance";
import { Component } from "./Component";
import { ComponentVersion } from "./ComponentVersion";
import { PropItem } from "./PropItem";
import { SoftDelete } from "../config/soft-delete";

@SoftDelete()
@Entity()
export class PropValue extends BaseEntity {

  @Property({ type: 'tinyint' })
  type: PropValueType;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'propItemId' })
  propItem: PropItem;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'componentId' })
  component: Component;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'componentVersionId' })
  componentVersion: ComponentVersion;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'instanceId' })
  componentInstance?: ComponentInstance;

  @Property({ length: 1000 })
  value = '';

  @Property({ length: 100, comment: '记录上层列表属性链上的每一个父级PropValue ID' })
  abstractValueIdChain = '';

  @Property({ columnType: 'double', comment: '列表属性链上每一个同级value的顺序，配合abstractValueIdChain使用' })
  order = 0;

  @Property({ type: 'tinyint' })
  valueStruct: ValueStruct = ValueStruct.Common;

  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  propItemId?: number;

  @Property({ persist: false })
  componentId?: number;

  @Property({ persist: false })
  componentVersionId?: number;


  @Property({ persist: false })
  releaseId?: number;

  @Property({ persist: false })
  componentInstanceId?: number;
}
