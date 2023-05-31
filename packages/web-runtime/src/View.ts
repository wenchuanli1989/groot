import type { Metadata, PropTask, Resource, ResourceConfig, ResourceTask, ViewData } from "@grootio/common";
import { PostMessageType } from "@grootio/common";

import { buildComponent, destoryMetadata, reBuildComponent } from "./compiler";
import { controlMode, globalConfig } from "./config";
import { destoryResource, buildResource } from "./resource";

type ParamsType = {
  metadataList: Metadata[],
  resourceList?: Resource[],
  propTaskList?: PropTask[],
  resourceTaskList?: ResourceTask[],
  resourceConfigList?: ResourceConfig[]
}
export class View {
  readonly key: string;
  private url: string;
  private metadataList: Metadata[];
  private resourceList: Resource[];
  private propTaskList: PropTask[]
  private resourceTaskList: ResourceTask[]
  private resourceConfigList: ResourceConfig[]

  rootComponent?: any;
  status: 'loading' | 'finish';
  readonly controlMode: boolean;
  private rootMetadata: Metadata;
  private metadataPromise?: Promise<ParamsType>;
  private fetchMetadataResolve?: (data: ParamsType) => void;

  constructor(data: ViewData, controlMode: boolean) {
    this.key = data.key;
    this.url = data.url;
    this.metadataList = data.metadataList;
    this.resourceList = data.resourceList;
    this.propTaskList = data.propTaskList;
    this.resourceTaskList = data.resourceTaskList;
    this.resourceConfigList = data.resourceConfigList

    this.controlMode = controlMode;

    if (!controlMode && !this.url && !this.metadataList) {
      throw new Error('数据异常');
    }
  }

  public init(): Promise<View> {
    const result = this.metadataList ? Promise.resolve(null) : this.loadMetadata().then(({ metadataList, resourceList, propTaskList, resourceTaskList, resourceConfigList }) => {
      this.metadataList = metadataList;
      this.propTaskList = propTaskList;
      this.resourceList = resourceList;
      this.resourceTaskList = resourceTaskList;
      this.resourceConfigList = resourceConfigList
    })

    return result.then(() => {
      buildResource(this.resourceList, this.key, this.resourceTaskList, this.resourceConfigList,)
      this.rootMetadata = this.metadataList.find(m => !m.parentId);
      this.rootComponent = buildComponent(this.rootMetadata, this.metadataList, this.propTaskList, this.key);
      this.status = 'finish';
      return this;
    })
  }

  public initCallback(data) {
    this.fetchMetadataResolve(data);
  }

  public update(metadataList: Metadata | Metadata[]) {
    const multi = Array.isArray(metadataList);
    if (multi) {
      this.fullUpdate(metadataList);
    } else {
      this.incrementUpdate(metadataList)
    }
  }

  public destory() {
    destoryResource(this.key)
    destoryMetadata(this.key)
  }

  public refresh() {
    globalConfig.refreshComponent(this.rootMetadata.id);
  }

  /**
   * 加载页面配置信息
   */
  private loadMetadata(): Promise<ParamsType> {
    if (this.status !== 'finish') {
      this.status = 'loading';
    }

    if (controlMode && this.controlMode) {
      window.parent.postMessage({ type: PostMessageType.InnerFetchView }, '*');
      if (!this.metadataPromise) {
        this.metadataPromise = new Promise((resolve) => {
          this.fetchMetadataResolve = (data) => {
            resolve(data);
          }
        })
      }

      return this.metadataPromise;
    } else if (this.url) {// 从远程地址加载配置信息
      if (!this.metadataPromise) {
        this.metadataPromise = fetch(this.url).then((res) => res.json())
      }

      return this.metadataPromise;
    } else {
      return Promise.reject('数据异常');
    }
  }

  private incrementUpdate(data: Metadata) {
    const metadata = this.metadataList.find(m => m.id === data.id);
    metadata.propsObj = data.propsObj;
    metadata.advancedProps = data.advancedProps;
    reBuildComponent(metadata, this.metadataList, [], this.key);// todo propTaskList
  }

  private fullUpdate(list: Metadata[]) {
    const rootMetadata = this.metadataList.find(m => !m.parentId);
    const newRootIndex = list.findIndex(item => !item.parentId);
    const newRootMetadata = list[newRootIndex];

    rootMetadata.propsObj = newRootMetadata.propsObj;
    rootMetadata.advancedProps = newRootMetadata.advancedProps;
    // 组件属性对象引用不能变
    list.splice(newRootIndex, 1, rootMetadata);
    this.metadataList = list;

    reBuildComponent(rootMetadata, this.metadataList, [], this.key);// todo propTaskList
  }
}