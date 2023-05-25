import { StudioMode } from "./enum";
import { Metadata } from "./internal";

export type UIManagerConfig = {
  /**
   * 应用唯一标识
   */
  appKey: string;
  /**
   * 应用环境标识
   */
  appEnv: string;
  /**
   * 所有可视化配置过程使用到的组件
   */
  modules: { [packageName: string]: { [moduleName: string]: any } };
  /**
   * 可视化配置的产物存放的地址，一般为CDN地址
   */
  appDataUrl?: string;
  /**
   * grout服务地址，当appDataUrl无效时，会根据serverUrl生成默认appDataUrl地址
   */
  serverUrl?: string;
  /**
   * 浏览器真正访问可视化页面才加载应用信息
   */
  lazyLoadApplication?: boolean;
  /**
   * 加载应用前方法回调
   */
  beforeLoadApplication?: () => Promise<any> | void;
  /**
   * 是否是调试模式，可输出详细的日志信息
   */
  debug?: boolean;
  /**
   * 是否对最小颗粒的组件进行包裹以提供辅助信息，可视化模式需要该功能
   */
  useWrapper?: boolean;
  /**
   * 将项目代码共享到可视化配置代码块中访问
   */
  shared?: Record<string, any>;

  createComponent?: (metadata: Metadata, viewEleMap: Map<number, HTMLElement>, viewMetadataMap: Map<number, Metadata>) => any,
  refreshComponent?: (metadataId: number) => void;
};


/**
 * groot运行时实例
 */
export type GrootType = {
  version: string,
  /**
   * 可视化控制模式，prototype原型设计模式，instance实例模式
   */
  controlMode: StudioMode,
  /**
   * 配置信息
   */
  config: UIManagerConfig
}