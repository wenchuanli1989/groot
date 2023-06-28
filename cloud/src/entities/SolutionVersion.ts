import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { Solution } from "./Solution";
import { SoftDelete } from "../config/soft-delete";

@SoftDelete()
@Entity()
export class SolutionVersion extends BaseEntity {

  @Property({ length: 20 })
  name: string;

  // 调试各种功能的演练场接受外部窗口传来调试参数
  @Property({ length: 100, comment: ' 调试功能的演练场页面地址，可以接受外部窗口传来调试参数' })
  playgroundPath: string;

  @Property({ length: 100, comment: '前端页面开发调试地址' })
  debugBaseUrl: string;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'solutionId' })
  solution: Solution;

  //************************已下是接口入参或者查询返回需要定义的属性************************

}