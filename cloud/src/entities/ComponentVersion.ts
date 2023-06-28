import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { Component } from "./Component";
import { SoftDelete } from "../config/soft-delete";

@SoftDelete()
@Entity()
export class ComponentVersion extends BaseEntity {

  @Property({ length: 20 })
  name: string;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'componentId' })
  component: Component;

  @Property({ comment: '是否对外发布，一旦发布禁止修改配置' })
  publish = false;

  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  imageVersionId?: number;

}