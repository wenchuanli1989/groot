import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { ComponentInstance } from "./ComponentInstance";
import { Release } from "./Release";

@Entity()
export class Resource extends BaseEntity {
  @Property({ length: 20 })
  name: string;

  @Property({ length: 1000 })
  value: string;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'instanceId' })
  componentInstance?: ComponentInstance;

  @Property({ length: 20 })
  type: string;

  @Property({ length: 20 })
  subType = '';

  @ManyToOne({ serializer: value => value?.id, serializedName: 'releaseId' })
  release: Release;

  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  instanceId?: number;

  @Property({ persist: false })
  releaseId?: number;
}