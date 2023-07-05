import { Resource, ResourceConfig } from "./entities";
import { PropTask, ResourceTask } from "./extension";

export type ApplicationData = {
  name: string,
  key: string,
  viewList: ViewData[],
  resourceList?: Resource[],
  resourceConfigList?: ResourceConfig[],
  resourceTaskList?: ResourceTask[],
  envData?: { key: string, value: string }[],
}

export type ViewData = {
  // 仅供ApplicationData.viewList使用
  key: string;
  primaryView?: boolean;
  // 加载view的地址，仅供ApplicationData.viewList使用
  url?: string;
} & ViewDataCore

export type ViewDataCore = {
  metadataList?: Metadata[];
  // propTaskList的key和advancedProps的type对应
  propTaskList?: PropTask[],

  resourceList?: Resource[];
  // resource的taskName和resourceTaskList的key对应
  resourceTaskList?: ResourceTask[],
  resourceConfigList?: ResourceConfig[],
}

export type Metadata = {
  id: number,
  packageName: string,
  componentName: string,
  viewId: number,
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








