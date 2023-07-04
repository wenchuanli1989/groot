import { ManyToOne, Property } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { ResourceConfig } from "./ResourceConfig";
import { Project } from "./Project";

export abstract class Resource extends BaseEntity {
  @Property({ length: 20 })
  name: string;

  @Property({ length: 1000 })
  value: string;

  @Property({ length: 20 })
  namespace: string;

  @Property({ length: 20 })
  type = '';

  @ManyToOne({ serializer: value => value?.id, serializedName: 'resourceConfigId' })
  resourceConfig?: ResourceConfig;

  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'projectId' })
  project: Project;
  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  resourceConfigId?: number
}