import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import { Release } from "./Release";
import { Resource } from "./Resource";
import { SoftDelete } from "../config/soft-delete";
import { View } from "./View";
import { Application } from "./Application";
import { ProjectResource } from "./ProjectResource";
import { Project } from "./Project";

@SoftDelete()
@Entity()
export class ViewResource extends Resource {

  @ManyToOne({ serializer: value => value?.id, serializedName: 'releaseId' })
  release: Release;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'viewId' })
  view: View;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'imageResourceId' })
  imageResource?: ProjectResource;

  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: app => app?.id, serializedName: 'appId' })
  app: Application;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'projectId' })
  project: Project;
  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  releaseId: number

  @Property({ persist: false })
  viewId: number

  @Property({ persist: false })
  imageResourceId: number
}