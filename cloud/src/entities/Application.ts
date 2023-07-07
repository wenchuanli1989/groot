import { Entity, ManyToOne, OneToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { ExtensionInstance } from "./ExtensionInstance";
import { Project } from "./Project";
import { Release } from "./Release";
import { AppResource } from "./AppResource";
import { ResourceConfig } from "./ResourceConfig";
import { SoftDelete } from "../config/soft-delete";
import { View } from "./View";

@SoftDelete()
@Entity()
export class Application extends BaseEntity {

  @Property({ length: 20 })
  name: string;

  @Property({ length: 20, comment: '应用英文名' })
  key: string;

  @Property({ length: 100, comment: ' 调试功能的演练场页面地址，可以接受外部窗口传来调试参数' })
  playgroundPath: string;

  // 此处必须为可选，否则创建application会引发devRelease非空校验
  @OneToOne({ serializer: value => value?.id, serializedName: 'devReleaseId' })
  devRelease: Release = { id: 0 } as any;

  // 此处必须为可选，否则创建application会引发qaRelease非空校验
  @OneToOne({ serializer: value => value?.id, serializedName: 'qaReleaseId' })
  qaRelease: Release = { id: 0 } as any;

  // 此处必须为可选，否则创建application会引发plRelease非空校验
  @OneToOne({ serializer: value => value?.id, serializedName: 'plReleaseId' })
  plRelease: Release = { id: 0 } as any;

  // 此处必须为可选，否则创建application会引发onlineRelease非空校验
  @OneToOne({ serializer: value => value?.id, serializedName: 'onlineReleaseId' })
  onlineRelease: Release = { id: 0 } as any;

  @Property({ length: 100, comment: '应用对应前端页面开发调试地址' })
  debugBaseUrl: string;

  @Property({ comment: '发布部署时是否需要审批操作' })
  deployApprove = false;

  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'projectId' })
  project: Project;
  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  extensionInstanceList: ExtensionInstance[]

  @Property({ persist: false })
  resourceList: AppResource[]

  @Property({ persist: false })
  releaseId: number

  @Property({ persist: false })
  resourceConfigList: ResourceConfig[]

  @Property({ persist: false })
  relatedViewId: number

  @Property({ persist: false })
  release: Release

  @Property({ persist: false })
  viewList: View[];

  @Property({ persist: false })
  projectId: number

  // @Property({ persist: false })
  // release: Release;

  // @Property({ persist: false })
  // releaseList: Release[];

  // @Property({ persist: false })
  // devReleaseId: number;

  // @Property({ persist: false })
  // qaReleaseId: number;

  // @Property({ persist: false })
  // plReleaseId: number;

  // @Property({ persist: false })
  // onlineReleaseId: number;

}