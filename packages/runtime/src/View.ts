import type { Metadata, State, ViewData } from "@grootio/common";
import { PostMessageType } from "@grootio/common";

import { buildComponent, reBuildComponent } from "./compiler";
import { controlMode } from "./config";

export class View {
  readonly key: string;
  readonly controlMode: boolean;
  rootComponent?: any;
  status: 'loading' | 'finish';
  private metadataUrl: string;
  private metadataList: Metadata[];
  private stateList: State[];
  private metadataPromise?: Promise<{ metadataList: Metadata[], stateList: State[] }>;
  private fetchMetadataResolve?: (data: { metadataList: Metadata[], stateList: State[] }) => void;

  constructor(data: ViewData, controlMode: boolean) {
    this.key = data.key;
    this.metadataUrl = data.metadataUrl;
    this.metadataList = data.metadataList;
    this.stateList = data.stateList;
    this.controlMode = controlMode;

    if (!controlMode && !this.metadataUrl && (!Array.isArray(this.metadataList) || this.metadataList.length === 0)) {
      throw new Error('metadataUrl 和 metadataList 不能同时为空');
    }
  }

  public init(): Promise<View> {
    return this.loadMetadata().then(({ metadataList, stateList }) => {
      this.metadataList = metadataList;
      this.stateList = stateList;
      const rootMetadata = this.metadataList.find(m => !m.parentId);
      this.rootComponent = buildComponent(rootMetadata, this.metadataList, true);
      this.status = 'finish';
      return this;
    })
  }

  public update(metadataList: Metadata | Metadata[], stateList?: State[]) {
    const multi = Array.isArray(metadataList);
    if (this.status === 'finish') {
      if (multi) {
        this.fullUpdate(metadataList);
      } else {
        this.incrementUpdate(metadataList)
      }
    } else {
      this.fetchMetadataResolve({ metadataList: multi ? metadataList : [metadataList], stateList });
    }
  }

  /**
   * 加载页面配置信息
   */
  private loadMetadata(): Promise<{ metadataList: Metadata[], stateList: State[] }> {
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
    } else if (this.metadataList && this.stateList) {
      return Promise.resolve({ metadataList: this.metadataList, stateList: this.stateList });
    } else if (this.metadataUrl) {// 从远程地址加载配置信息
      if (!this.metadataPromise) {
        this.metadataPromise = fetch(this.metadataUrl).then((res) => res.json())
      }

      return this.metadataPromise;
    } else {
      return Promise.reject('metadataUrl and metadata can not both be empty');
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
    list.splice(newRootIndex, 1, rootMetadata);
    this.metadataList = list;

    reBuildComponent(rootMetadata, this.metadataList);
  }
}