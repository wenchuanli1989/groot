import { Entity, OneToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { ComponentVersion } from "./ComponentVersion";
import { PropBlock } from "./PropBlock";
import { PropGroup } from "./PropGroup";
import { PropItem } from "./PropItem";
import { PropValue } from "./PropValue";

@Entity()
export class Component extends BaseEntity {

  @Property({ length: 20 })
  name: string;

  @Property({ length: 30, comment: '组件虚拟包名' })
  packageName: string;

  @Property({ length: 20, comment: '组件名' })
  componentName: string;

  /**
   * 此处必须为可选，否则创建组建会引发recentVersion非空校验
   */
  @OneToOne({ serializer: value => value?.id, serializedName: 'recentVersionId', comment: '组件最新版本' })
  recentVersion?: ComponentVersion;


  //************************已下是接口入参或者查询返回需要定义的属性************************

  /**
   * 组件版本列表
   */
  @Property({ persist: false })
  versionList: ComponentVersion[];

  @Property({ persist: false })
  componentVersion: ComponentVersion;

  // @Property({ persist: false })
  // release: Release;

  // @Property({ persist: false })
  // releaseList: Release[];

  @Property({ persist: false })
  solutionId?: number;

  @Property({ persist: false })
  groupList?: PropGroup[];

  @Property({ persist: false })
  blockList?: PropBlock[];

  @Property({ persist: false })
  itemList?: PropItem[];

  @Property({ persist: false })
  valueList?: PropValue[];

  @Property({ persist: false })
  solutionVersionId?: number;

  @Property({ persist: false })
  componentVersionId?: number;
}
