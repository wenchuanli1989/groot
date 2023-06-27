import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { ComponentInstance } from "./ComponentInstance";
import { ExtensionInstance } from "./ExtensionInstance";
import { SolutionVersion } from "./SolutionVersion";
import { SolutionComponent } from "./SolutionComponent";

@Entity()
export class SolutionInstance extends BaseEntity {


  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionVersionId' })
  solutionVersion: SolutionVersion;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'entryId' })
  entry: ComponentInstance;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionEntryId' })
  solutionEntry?: SolutionComponent

  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  extensionInstanceList: ExtensionInstance[]

  @Property({ persist: false })
  solutionVersionId: number

  @Property({ persist: false })
  solutionId: number
}