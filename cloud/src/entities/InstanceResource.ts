import { ManyToOne } from "@mikro-orm/core";
import { Release } from "./Release";
import { Resource } from "./Resource";
import { ComponentInstance } from "./ComponentInstance";

export abstract class InstanceResource extends Resource {

  @ManyToOne({ serializer: value => value?.id, serializedName: 'releaseId' })
  release: Release;

  @ManyToOne({ serializer: value => value?.id, serializedName: 'componentInstanceId' })
  componentInstance: ComponentInstance;
  //************************已下是接口入参或者查询返回需要定义的属性************************

}