import { Entity, ManyToOne, OneToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { Extension } from "./Extension";
import { LargeText } from "./LargeText";

@Entity()
export class ExtensionVersion extends BaseEntity {

  @Property({ length: 30 })
  name: string;

  @Property()
  defaultConfig?: LargeText;

  @Property({ length: 30, comment: 'webpack模块联邦包名' })
  packageName = '';

  @Property({ length: 30, comment: 'webpack模块联邦模块名' })
  moduleName = '';

  // todo 保证扩展根据assetUrl全局唯一
  @Property({ length: 100, comment: 'webpack模块联邦暴露出来可访问js地址' })
  assetUrl = '';

  @OneToOne({ serializer: value => value?.text })
  propItemPipeline?: LargeText;

  @OneToOne({ serializer: value => value?.text })
  propItemPipelineRaw?: LargeText

  @OneToOne({ serializer: value => value?.text })
  resourcePipeline?: LargeText;

  @OneToOne({ serializer: value => value?.text })
  resourcePipelineRaw?: LargeText

  @ManyToOne({ serializer: value => value?.id, serializedName: 'extensionId' })
  extension: Extension;

  //************************已下是接口入参或者查询返回需要定义的属性************************
}