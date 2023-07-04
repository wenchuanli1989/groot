import { Entity, ManyToOne, OneToOne } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { Bundle } from "./Bundle";
import { Release } from "./Release";
import { Deploy } from "./Deploy";
import { LargeText } from "./LargeText";
import { SoftDelete } from "../config/soft-delete";
import { Application } from "./Application";
import { Project } from "./Project";

@SoftDelete()
@Entity()
export class DeployManifest extends BaseEntity {

  @OneToOne({ serializer: value => value.text })
  content: LargeText;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'releaseId' })
  release: Release;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'bundleId' })
  bundle: Bundle;

  @OneToOne({ serializer: value => value?.id, serializedName: 'deployId' })
  deploy: Deploy;

  /**
   * 必要领域归属字段
   */
  @ManyToOne({ serializer: value => value?.id, serializedName: 'appId' })
  app: Application

  @ManyToOne({ serializer: value => value?.id, serializedName: 'projectId' })
  project: Project;
}