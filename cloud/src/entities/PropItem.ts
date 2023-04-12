import { PropItemStruct } from "@grootio/common";
import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { Component } from "./Component";
import { ComponentVersion } from "./ComponentVersion";
import { PropBlock } from "./PropBlock";
import { PropGroup } from "./PropGroup";

@Entity()
export class PropItem extends BaseEntity {

  @Property({ length: 20 })
  label: string;

  @Property({ type: 'tinyint' })
  struct: PropItemStruct = PropItemStruct.Normal;

  @Property({ length: 50 })
  viewType = 'text';

  @ManyToOne({ serializer: value => value?.id, serializedName: 'groupId' })
  group: PropGroup;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'blockId' })
  block: PropBlock;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'componentId' })
  component: Component;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'componentVersionId' })
  componentVersion: ComponentVersion;

  /**
   * 显示宽度，24格
   */
  @Property()
  span = 24;

  /**
   * 是否是组件根属性，如果为true则不会继承父级配置块
   */
  @Property()
  rootPropKey = false;

  @Property({ columnType: 'double' })
  order: number;

  /**
   * 版本升级时，确认当前propItem是否被改动的判断条件
   * 上一个版本versionTraceId，如果为空则是上一个版本对应propItem 的 ID
   * 如果propItem类型变化，则重置versionTraceId为当前ID，并删除管理propValue
   * 组件实例在升级组件版本时可以尽量保留propValue
   */
  @Property()
  versionTraceId = 0;

  /**
   * 类型为Hierarchy Item时，所属下级配置组
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'childGroupId' })
  childGroup?: PropGroup;

  @Property({ length: 20 })
  propKey = '';

  /**
   * 配置项默认值，json化存储 
   * @todo 考虑去json，改为结构化
   */
  @Property({ length: 1000 })
  defaultValue = '';

  /**
   * 类型为多选，单选，下拉框时所对应选项列表，json化存储
   */
  @Property({ length: 200 })
  valueOptions = '';

  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  blockId?: number;

}

