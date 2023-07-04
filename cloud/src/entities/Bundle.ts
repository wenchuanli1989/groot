import { Collection, Entity, ManyToMany, ManyToOne, OneToOne, Property } from "@mikro-orm/core";

import { BundleAsset } from "./BundleAsset";
import { BaseEntity } from "./BaseEntity";
import { Release } from "./Release";
import { Application } from "./Application";
import { LargeText } from "./LargeText";
import { SoftDelete } from "../config/soft-delete";
import { Project } from "./Project";

@SoftDelete()
@Entity()
export class Bundle extends BaseEntity {

  @ManyToOne({ serializer: value => value?.id, serializedName: 'releaseId' })
  release: Release;

  @ManyToMany()
  newAssetList = new Collection<BundleAsset>(this);

  @ManyToMany()
  oldAssetList = new Collection<BundleAsset>(this);

  @Property({ length: 100 })
  remark = '';

  @OneToOne({ serializer: value => value.text })
  manifest?: LargeText

  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'appId' })
  app: Application

  @ManyToOne({ serializer: value => value?.id, serializedName: 'projectId' })
  project: Project;
}
