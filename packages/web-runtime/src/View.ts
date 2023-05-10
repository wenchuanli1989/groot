import type { Metadata, Resource, ViewData } from "@grootio/common";
import { PostMessageType } from "@grootio/common";

import { buildComponent, reBuildComponent } from "./compiler";
import { controlMode, globalConfig } from "./config";
import { destoryResource, initResource } from "./resource";

export class View {
  readonly key: string;
  readonly controlMode: boolean;
  rootComponent?: any;
  status: 'loading' | 'finish';
  private metadataUrl: string;
  private metadataList: Metadata[];
  private resourceList: Resource[];
  private resourceNamespaceKeyList: string[] = [];
  private metadataPromise?: Promise<{ metadataList: Metadata[], resourceList: Resource[] }>;
  private fetchMetadataResolve?: (data: { metadataList: Metadata[], resourceList: Resource[] }) => void;
  private rootMetadata: Metadata;

  constructor(data: ViewData, controlMode: boolean) {
    this.key = data.key;
    this.metadataUrl = data.metadataUrl;
    this.metadataList = data.metadataList;
    this.resourceList = data.resourceList;
    this.controlMode = controlMode;

    if (!controlMode && !this.metadataUrl && (!Array.isArray(this.metadataList) || this.metadataList.length === 0)) {
      throw new Error('metadataUrl 和 metadataList 不能同时为空');
    }
  }

  public init(): Promise<View> {
    return this.loadMetadata().then(({ metadataList, resourceList }) => {
      this.metadataList = metadataList;
      this.resourceList = resourceList || [];
      this.resourceNamespaceKeyList = initResource(this.resourceList)
      this.rootMetadata = this.metadataList.find(m => !m.parentId);
      this.rootComponent = buildComponent(this.rootMetadata, this.metadataList, true);
      this.status = 'finish';
      return this;
    })
  }

  public update(metadataList: Metadata | Metadata[], resourceList?: Resource[]) {
    const multi = Array.isArray(metadataList);
    if (this.status === 'finish') {
      if (multi) {
        this.fullUpdate(metadataList);
      } else {
        this.incrementUpdate(metadataList)
      }
    } else {
      this.fetchMetadataResolve({ metadataList: multi ? metadataList : [metadataList], resourceList });
    }
  }

  public destory() {
    destoryResource(this.resourceNamespaceKeyList)
  }

  public refresh() {
    globalConfig.refreshComponent(this.rootMetadata.id);
  }

  /**
   * 加载页面配置信息
   */
  private loadMetadata(): Promise<{ metadataList: Metadata[], resourceList: Resource[] }> {
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
    } else if (this.metadataList) {
      return Promise.resolve({ metadataList: this.metadataList, resourceList: this.resourceList });
    } else if (this.metadataUrl) {// 从远程地址加载配置信息
      if (!this.metadataPromise) {
        this.metadataPromise = fetch(this.metadataUrl).then((res) => res.json())
      }

      return this.metadataPromise;
    } else {
      return Promise.reject('view数据异常');
    }
  }

  private incrementUpdate(data: Metadata) {
    const metadata = this.metadataList.find(m => m.id === data.id);
    metadata.propsObj = data.propsObj;
    metadata.advancedProps = data.advancedProps;
    reBuildComponent(metadata, this.metadataList);
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

    reBuildComponent(rootMetadata, this.metadataList);
  }
}