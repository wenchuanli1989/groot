import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { SoftDelete } from "../config/soft-delete";
import { Project } from "./Project";
import { Application } from "./Application";

@SoftDelete()
@Entity()
export class View extends BaseEntity {

  @Property({ length: 100, comment: '实例英文名，值为组件对应页面访问地址' })
  key = '';

  @Property({ length: 20 })
  name: string;

  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'projectId' })
  project: Project;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'appId' })
  app: Application;
  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  solutionComponentId: number

  @Property({ persist: false })
  appId: number

  @Property({ persist: false })
  viewVersionId: number

  @Property({ persist: false })
  primaryView: boolean
}