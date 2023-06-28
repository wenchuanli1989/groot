import { Entity, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { SoftDelete } from "../config/soft-delete";

@SoftDelete()
@Entity()
export class Organization extends BaseEntity {

  @Property({ length: 20 })
  name: string;

  //************************已下是接口入参或者查询返回需要定义的属性************************


}