import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { Component } from "./Component";
import { SoftDelete } from "../config/soft-delete";
import { Solution } from "./Solution";

@SoftDelete()
@Entity()
export class ComponentVersion extends BaseEntity {

  @Property({ length: 20 })
  name: string;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'componentId' })
  component: Component;

  @Property({ comment: '是否对外发布，一旦发布禁止修改配置' })
  publish = false;

  // todo
  @Property({ length: 100, comment: 'webpack模块联邦暴露出来可访问js地址' })
  assetUrl = '';

  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionId' })
  solution: Solution
  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  imageVersionId?: number;

}