import { Entity, ManyToOne, Property } from "@mikro-orm/core";

import { BaseEntity } from "./BaseEntity";
import { ComponentInstance } from "./ComponentInstance";
import { Application } from "./Application";

@Entity()
export class Release extends BaseEntity {

  @Property({ length: 20 })
  name: string;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'applicationId' })
  application: Application;

  @Property({ comment: '迭代版本是否归档，并限制组件实例修改' })
  archive = false;

  @Property({ length: 100, comment: '迭代对应前端页面开发调试地址' })
  debugBaseUrl: string;

  @Property({ length: 100, comment: ' 调试功能的演练场页面地址，可以接受外部窗口传来调试参数' })
  playgroundPath: string;

  //************************已下是接口入参或者查询返回需要定义的属性************************

  @Property({ persist: false })
  imageReleaseId: number;
}
