import { Entity, Enum, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { SoftDelete } from "../config/soft-delete";
import { SolutionComponent } from "./SolutionComponent";
import { SolutionTag } from "./SolutionTag";
import { TagNatureType } from "@grootio/common";

@SoftDelete()
@Entity()
export class SolutionComponentTag extends BaseEntity {

  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionTagId' })
  solutionTag: SolutionTag;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionComponentId' })
  solutionComponent: SolutionComponent;

  @Enum({ comment: '标签性质：1打标 2使用' })
  type: TagNatureType

  //************************已下是接口入参或者查询返回需要定义的属性************************


}