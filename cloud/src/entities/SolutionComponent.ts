import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { ComponentVersion } from "./ComponentVersion";
import { SolutionVersion } from "./SolutionVersion";
import { SoftDelete } from "../config/soft-delete";
import { Component } from "./Component";
import { Solution } from "./Solution";

@SoftDelete()
@Entity()
export class SolutionComponent extends BaseEntity {
  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionVersionId' })
  solutionVersion: SolutionVersion;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'componentVersionId' })
  componentVersion: ComponentVersion;

  @ManyToOne()
  component: Component;

  /**
   * 组件是否可以作为view
   */
  @Property()
  view = false

  @ManyToOne({ serializer: value => value?.id, serializedName: 'parentId' })
  parent?: SolutionComponent;

  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionId' })
  solution: Solution;
  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  parentId?: number

  @Property({ persist: false })
  componentVersionId?: number

  @Property({ persist: false })
  solutionVersionId?: number
}