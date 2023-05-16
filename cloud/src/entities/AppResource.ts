import { Entity, ManyToOne } from "@mikro-orm/core";
import { Application } from "./Application";
import { Resource } from "./Resource";
import { Release } from "./Release";

@Entity()
export class AppResource extends Resource {

  @ManyToOne({ serializer: app => app?.id, serializedName: 'appId' })
  app: Application;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'releaseId' })
  release: Release;

  //************************已下是接口入参或者查询返回需要定义的属性************************

}