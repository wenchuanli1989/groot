import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import { Application } from "./Application";
import { Resource } from "./Resource";
import { Release } from "./Release";
import { ProjectResource } from "./ProjectResource";
import { SoftDelete } from "../config/soft-delete";

@SoftDelete()
@Entity()
export class AppResource extends Resource {

  @ManyToOne({ serializer: app => app?.id, serializedName: 'appId' })
  app: Application;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'releaseId' })
  release: Release;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'imageResourceId' })
  imageResource?: ProjectResource;
  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  appId: number

  @Property({ persist: false })
  imageResourceId: number

  @Property({ persist: false })
  releaseId: number
}