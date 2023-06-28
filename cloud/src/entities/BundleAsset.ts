import { Entity, ManyToOne, OneToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { Bundle } from "./Bundle";
import { ComponentInstance } from "./ComponentInstance";
import { LargeText } from "./LargeText";
import { SoftDelete } from "../config/soft-delete";

@SoftDelete()
@Entity()
export class BundleAsset extends BaseEntity {

  @OneToOne({ serializer: value => value.text })
  content: LargeText;

  @Property({ length: 100, comment: '应用级别唯一标识，保证多次部署可以共用部分构建资源' })
  manifestKey: string;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'entryId' })
  entry: ComponentInstance

  @ManyToOne({ serializer: value => value?.id, serializedName: 'bundleId', comment: '最初创建asset的bundle' })
  bundle: Bundle
}