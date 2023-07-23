import { ComponentParserType } from "@grootio/common";
import { Entity, Enum, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { Component } from "./Component";
import { ComponentVersion } from "./ComponentVersion";
import { PropBlock } from "./PropBlock";
import { PropGroup } from "./PropGroup";
import { PropItem } from "./PropItem";
import { PropValue } from "./PropValue";
import { SolutionInstance } from './SolutionInstance'
import { SoftDelete } from "../config/soft-delete";
import { View } from "./View";
import { Application } from "./Application";
import { Project } from "./Project";
import { SolutionComponent } from "./SolutionComponent";
import { Solution } from "./Solution";
import { ViewVersion } from "./ViewVersion";

@SoftDelete()
@Entity()
export class ComponentInstance extends BaseEntity {

  @ManyToOne()
  component: Component;

  @ManyToOne()
  componentVersion: ComponentVersion;

  @Property({ comment: '一般为组件实例第一次创建时的ID，多个版本迭代实例重新创建，但是trackI永远复制上一个版本的，保证多版本迭代之间还可以追溯组件实例的历史记录' })
  trackId: number;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'viewId' })
  view: View;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'viewVersionId' })
  viewVersion: ViewVersion;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'parentId' })
  parent?: ComponentInstance;

  @Enum()
  parserType: ComponentParserType = ComponentParserType.ReactComponent;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionInstanceId' })
  solutionInstance: SolutionInstance;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionComponentId' })
  solutionComponent: SolutionComponent;

  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionId' })
  solution: Solution

  @ManyToOne({ serializer: value => value?.id, serializedName: 'appId' })
  app: Application

  @ManyToOne({ serializer: value => value?.id, serializedName: 'projectId' })
  project: Project;

  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  groupList?: PropGroup[];

  @Property({ persist: false })
  blockList?: PropBlock[];

  @Property({ persist: false })
  itemList?: PropItem[];

  @Property({ persist: false })
  valueList?: PropValue[];

  @Property({ persist: false })
  componentId?: number;

  @Property({ persist: false })
  releaseId?: number;

  // @Property({ persist: false })
  // componentVersionId?: number;

  @Property({ persist: false })
  parentId?: number;

  @Property({ persist: false })
  viewId?: number;

  @Property({ persist: false })
  solutionInstanceId?: number;

  @Property({ persist: false })
  solutionComponentId?: number;

  @Property({ persist: false })
  componentVersionId?: number;
}
