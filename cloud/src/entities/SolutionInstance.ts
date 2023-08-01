import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { ExtensionInstance } from "./ExtensionInstance";
import { SolutionVersion } from "./SolutionVersion";
import { SoftDelete } from "../config/soft-delete";
import { Solution } from "./Solution";
import { View } from "./View";
import { Project } from "./Project";
import { Application } from "./Application";
import { ViewVersion } from "./ViewVersion";
import { SolutionComponent } from "./SolutionComponent";

@SoftDelete()
@Entity()
export class SolutionInstance extends BaseEntity {

  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionVersionId' })
  solutionVersion: SolutionVersion;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'viewId' })
  view: View;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'viewVersionId' })
  viewVersion: ViewVersion;

  @Property()
  primary = false
  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionId' })
  solution: Solution;


  @ManyToOne({ serializer: value => value?.id, serializedName: 'projectId' })
  project: Project;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'appId' })
  app: Application;
  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  extensionInstanceList: ExtensionInstance[]

  @Property({ persist: false })
  solutionComponentList: SolutionComponent[]

  @Property({ persist: false })
  solutionVersionId: number

  @Property({ persist: false })
  solutionId: number

  @Property({ persist: false })
  solutionViewId: number
}