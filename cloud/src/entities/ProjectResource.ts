import { Entity, ManyToOne } from "@mikro-orm/core";
import { Project } from "./Project";
import { Resource } from "./Resource";

@Entity()
export class ProjectResource extends Resource {

  @ManyToOne({ serializer: project => project?.id, serializedName: 'projectId' })
  project: Project;

  //************************已下是接口入参或者查询返回需要定义的属性************************

}