import { Entity, ManyToOne, OneToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { ExtensionInstance } from "./ExtensionInstance";
import { Organization } from "./Organization";
import { SolutionVersion } from "./SolutionVersion";

@Entity()
export class Solution extends BaseEntity {

  @Property({ length: 20 })
  name: string;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'orgId' })
  org: Organization;

  @OneToOne({ serializer: value => value?.id, serializedName: 'recentVersionId', comment: '最新版本' })
  recentVersion?: SolutionVersion;

  //************************已下是接口入参或者查询返回需要定义的属性************************
  @Property({ persist: false })
  solutionVersionId: number;

  @Property({ persist: false })
  extensionInstanceList: ExtensionInstance[]

  @Property({ persist: false })
  solutionVersion: SolutionVersion;

  @Property({ persist: false })
  versionList: SolutionVersion[]
}