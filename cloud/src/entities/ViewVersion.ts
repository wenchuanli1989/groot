import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { SoftDelete } from "../config/soft-delete";
import { View } from "./View";
import { Project } from "./Project";
import { Application } from "./Application";

@SoftDelete()
@Entity()
export class ViewVersion extends BaseEntity {

  @Property({ length: 20 })
  name: string;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'viewId' })
  view: View;

  // @ManyToOne({ serializer: value => value?.id, serializedName: 'releaseId' })
  // release: Release;
  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'projectId' })
  project: Project;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'appId' })
  app: Application;
  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  imageViewVersionId: number
}