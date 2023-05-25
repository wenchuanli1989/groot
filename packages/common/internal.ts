import { Resource, ResourceConfig } from "./entities";

export type ApplicationData = {
  name: string,
  key: string,
  viewList: ViewData[],
  resourceList?: Resource[],
  resourceConfigList?: ResourceConfig[],
  resourceTaskList?: Task[],
  envData?: { key: string, value: string }[],
}

export type ViewData = {
  // 作为resource的context
  key: string;
  url?: string;
  metadataList?: Metadata[];
  // propTaskList的key和advancedProps的type对应
  propTaskList?: Task[],

  resourceList?: Resource[];
  // resource的taskName和resourceTaskList的key对应
  resourceTaskList?: Task[],
  resourceConfigList?: ResourceConfig[],
}

export type Metadata = {
  id: number,
  packageName: string,
  componentName: string,
  rootId: number,
  parentId?: number,

  advancedProps?: PropMetadata[],
  propsObj: Record<string, any>,

  $$runtime?: {
    propItemId: number,
    abstractValueIdChain?: string
  }
}

export type PropMetadata = {
  keyChain: string,
  type: string,
  data?: any
}


export type PropMetadataComponent = {
  setting: PropMetadataComponentSetting,
  list: PropMetadataComponentItem[],

  $$runtime?: {
    parentId: number,
    propKeyChain: string,
    propItemId: number,
    abstractValueIdChain?: string,
    solutionInstanceId: number,
    componentVersionId: number
  }
}


export type PropMetadataComponentItem = {
  instanceId: number,
  componentId: number,
  componentName: string,
  order: number
}

export type PropMetadataComponentSetting = {
}


export type Task = {
  key: string,
  content: string
}





