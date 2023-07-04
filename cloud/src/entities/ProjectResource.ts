import { Entity } from "@mikro-orm/core";
import { Resource } from "./Resource";
import { SoftDelete } from "../config/soft-delete";

@SoftDelete()
@Entity()
export class ProjectResource extends Resource {


  //************************已下是接口入参或者查询返回需要定义的属性************************

}