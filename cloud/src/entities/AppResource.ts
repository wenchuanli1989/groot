import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import { Resource } from "./Resource";
import { Release } from "./Release";
import { ProjectResource } from "./ProjectResource";
import { SoftDelete } from "../config/soft-delete";
import { Application } from "./Application";

@SoftDelete()
@Entity()
export class AppResource extends Resource {

  @ManyToOne({ serializer: value => value?.id, serializedName: 'releaseId' })
  release: Release;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'imageResourceId' })
  imageResource?: ProjectResource;

  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: app => app?.id, serializedName: 'appId' })
  app: Application;
  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  appId: number

  @Property({ persist: false })
  imageResourceId: number

  @Property({ persist: false })
  releaseId: number
}