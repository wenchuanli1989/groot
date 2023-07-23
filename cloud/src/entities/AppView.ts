import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { SoftDelete } from "../config/soft-delete";
import { Release } from "./Release";
import { ViewVersion } from "./ViewVersion";
import { View } from "./View";
import { Project } from "./Project";
import { Application } from "./Application";

@SoftDelete()
@Entity()
export class AppView extends BaseEntity {
  @ManyToOne({ serializer: value => value?.id, serializedName: 'releaseId' })
  release: Release;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'viewVersionId' })
  viewVersion: ViewVersion;

  @ManyToOne()
  view: View;

  @Property({ comment: '是否是页面级实例' })
  primaryView: boolean = false;

  /**
   * 必要领域归属字段
   */

  @ManyToOne({ serializer: value => value?.id, serializedName: 'projectId' })
  project: Project;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'appId' })
  app: Application;
  //************************已下是接口入参或者查询返回需要定义的属性************************

}