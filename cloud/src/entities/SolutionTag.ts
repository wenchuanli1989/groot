import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { SoftDelete } from "../config/soft-delete";
import { Solution } from "./Solution";

@SoftDelete()
@Entity()
export class SolutionTag extends BaseEntity {

  @Property({ length: 20 })
  name: string;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionId' })
  solution: Solution;

  //************************已下是接口入参或者查询返回需要定义的属性************************


}