import { ComponentParserType } from "@grootio/common";
import { Entity, Enum, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { Component } from "./Component";
import { ComponentVersion } from "./ComponentVersion";
import { PropBlock } from "./PropBlock";
import { PropGroup } from "./PropGroup";
import { PropItem } from "./PropItem";
import { PropValue } from "./PropValue";
import { Release } from "./Release";
import { SolutionInstance } from './SolutionInstance'
import { SoftDelete } from "../config/soft-delete";

@SoftDelete()
@Entity()
export class ComponentInstance extends BaseEntity {

  @Property({ length: 20 })
  name: string;

  @ManyToOne()
  component: Component;

  @ManyToOne()
  componentVersion: ComponentVersion;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'releaseId' })
  release: Release;

  @Property({ comment: '一般为组件实例第一次创建时的ID，多个版本迭代实例重新创建，但是trackI永远复制上一个版本的，保证多版本迭代之间还可以追溯组件实例的历史记录' })
  trackId: number;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'rootId' })
  root?: ComponentInstance;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'parentId' })
  parent?: ComponentInstance;

  @Property({ length: 100, comment: '实例英文名，如果是根组件实例时，该值为组件对应页面访问地址' })
  key = '';

  @Enum()
  parserType: ComponentParserType = ComponentParserType.ReactComponent;

  @Property({ comment: '是否是页面级组件入口' })
  mainEntry: boolean = false;

  @Property({ comment: '是否是组件入口' })
  entry: boolean = false;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionInstanceId' })
  solutionInstance?: SolutionInstance;

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
  rootId?: number;

  @Property({ persist: false })
  solutionInstanceId?: number;

  @Property({ persist: false })
  componentVersionId?: number;
}
