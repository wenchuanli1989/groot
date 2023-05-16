import { ManyToOne, Property } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { Release } from "./Release";
import { ResourceContext } from "./ResourceContext";

export abstract class Resource extends BaseEntity {
  @Property({ length: 20 })
  name: string;

  @Property({ length: 1000 })
  value: string;

  @Property({ length: 20 })
  type: string;

  @Property({ length: 20 })
  subType = '';

  @ManyToOne({ serializer: value => value?.id, serializedName: 'releaseId' })
  release: Release;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'resourceContextId' })
  resourceContext: ResourceContext;
  //************************已下是接口入参或者查询返回需要定义的属性************************

}