import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { ComponentVersion } from "./ComponentVersion";
import { SolutionVersion } from "./SolutionVersion";
import { SoftDelete } from "../config/soft-delete";
import { Component } from "./Component";

@SoftDelete()
@Entity()
export class SolutionComponent extends BaseEntity {
  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionVersionId' })
  solutionVersion: SolutionVersion;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'componentVersionId' })
  componentVersion: ComponentVersion;

  @ManyToOne()
  component: Component;

  @Property()
  entry = false

  @ManyToOne({ serializer: value => value?.id, serializedName: 'parentId' })
  parent?: SolutionComponent;
  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  parentId?: number

  @Property({ persist: false })
  componentVersionId?: number
}