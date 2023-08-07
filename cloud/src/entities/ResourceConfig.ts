import { Entity, ManyToOne, OneToOne, Property } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { SoftDelete } from "../config/soft-delete";
import { Project } from "./Project";
import { LargeText } from "./LargeText";

@SoftDelete()
@Entity()
export class ResourceConfig extends BaseEntity {
  @Property({ length: 20 })
  name: string;

  @OneToOne({ serializer: value => value?.text, serializedName: 'valueStr' })
  value?: LargeText;

  @Property({ length: 20 })
  type: string;

  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'projectId' })
  project: Project;
  //************************已下是接口入参或者查询返回需要定义的属性************************
}