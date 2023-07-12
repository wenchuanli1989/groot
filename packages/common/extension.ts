import { ReactElement } from "react";
import React from "react";
import { APIStore } from "./api/API.store";
import { Application, Component, ComponentInstance, ExtensionInstance, PropGroup, PropItem, Release, Resource, ResourceConfig, Solution, View } from "./entities";
import { GridLayout } from "./GridLayout";
import { ApplicationData, Metadata, ViewDataCore } from "./internal";
import { ExtensionLevel, ExtensionPipelineLevel } from "./enum";
import { RequestFnType } from "./request-factory";
import { GrootType, UIManagerConfig } from "./runtime";



export type GrootContext = {
  commandManager: CommandManager,
  stateManager: StateManager,
  hookManager: HookManager,
  extHandler: ExtensionHandler,
  loadExtension: (params: { remoteExtensionList: ExtensionRuntime[], extLevel: ExtensionLevel, solutionId?: number, viewId?: number }) => Promise<void>,
  launchExtension: (remoteExtensionList: ExtensionRuntime[], level: ExtensionLevel) => void,
  onReady: (callback: Function) => void;
}

export type GrootContextParams = {
  account: any,
  mode: string,
  releaseId: string,
  solutionVersionId: string,
  viewId?: string,
  componentVersionId?: string,
}

export type MainFunction<C> = (context: ExtensionContext, config?: C) => ExtensionConfigSchema;

export type ExtensionConfigSchema = {
  // todo 待开发，参照vscode设计https://code.visualstudio.com/api/references/contribution-points#contributes.configuration
}

export type ExtensionContext = {
  params: GrootContextParams,
  layout: GridLayout,
  extension: ExtensionRuntime,
  request: RequestFnType<APIStore>,
  groot: GrootContext,
}

export type ExtensionRuntime = {
  main: MainFunction<any>,
  config?: any,
  level: ExtensionLevel,
  configSchema?: any,
} & ExtensionInstance


export type CommandManager = <CT extends Record<string, [any[], any]> = GrootCommandDict>() => {
  registerCommand: GrootContextRegisterCommand<CT>,
  executeCommand: GrootContextExecuteCommand<CT>,
}

export type StateManager = <ST extends Record<string, [any, boolean]> = GrootStateDict>() => {
  registerState: GrootContextRegisterState<ST>,
  getState: GrootContextGetState<ST>,
  setState: GrootContextSetState<ST>,
  useStateByName: GrootContextUseStateByName<ST>,
  watchState: GrootContextWatchState<ST>
}

export type HookManager = <HT extends Record<string, [any[], any]> = GrootHookDict>() => {
  registerHook: GrootContextRegisterHook<HT>,
  callHook: GrootContextCallHook<HT>
}

export type GrootContextRegisterCommand<CT extends Record<string, [any[], any]>> = <K extends keyof CT & string, AR extends CT[K][0], R extends CT[K][1]>(commandName: K, command: (originCommand: Function, ...args: AR) => R) => Function
export type GrootContextExecuteCommand<CT extends Record<string, [any[], any]>> = <K extends keyof CT & string, AR extends CT[K][0], R extends CT[K][1]>(commandName: K, ...args: AR) => R;

export type GrootContextRegisterState<ST extends Record<string, [any, boolean]>> = <
  K extends keyof ST & string,
  T extends ST[K][0],
  B extends ST[K][1],
  D extends (B extends true ? T[] : T),
  N extends D
> (name: K, defaultValue: D, multi: B, onChange?: (newValue: N, event: { reason: string, directChange: boolean }) => void) => boolean;

export type GrootContextGetState<ST extends Record<string, [any, boolean]>> = <
  K extends keyof ST & string,
  T extends ST[K][0],
  B extends ST[K][1],
  R extends (B extends true ? T[] : T),
>(name: K) => R;

export type GrootContextWatchState<ST extends Record<string, [any, boolean]>> = <
  K extends keyof ST & string,
  T extends ST[K][0],
  B extends ST[K][1],
  N extends (B extends true ? T[] : T),
>(name: K, onChange: (newValue: N, event: { reason: string, directChange: boolean }) => void) => Function;

export type GrootContextSetState<ST extends Record<string, [any, boolean]>> = <
  K extends keyof ST & string,
  T extends ST[K][0],
  B extends ST[K][1],
  V extends (B extends true ? T[] : T)
>(name: K, value: V) => V;

export type GrootContextUseStateByName<ST extends Record<string, [any, boolean]>> = <
  K extends keyof ST & string,
  T extends ST[K][0],
  B extends ST[K][1],
  R extends (B extends true ? T[] : T),
  N extends R,
  D extends R
>(name: K, defaultValue?: D) => [R, (newValue: N) => R];

export type GrootContextRegisterHook<HT extends Record<string, [any[], any]>> = <
  K extends keyof HT & string,
  AR extends HT[K][0],
  R extends HT[K][1]
>(hookName: K, hook: (...args: AR) => R, emitPrevArgs?: boolean) => Function

export type GrootContextCallHook<HT extends Record<string, [any[], any]>> = <
  K extends keyof HT & string,
  AR extends HT[K][0],
  R extends HT[K][1]
>(commandName: K, ...args: AR) => R[];

export type GrootCommandDict = {
  'gc.ui.render.banner': [[], ReactElement | null],
  'gc.ui.render.activityBar': [[], ReactElement | null],
  'gc.ui.render.primarySidebar': [[], ReactElement | null],
  'gc.ui.render.secondarySidebar': [[], ReactElement | null],
  'gc.ui.render.stage': [[], ReactElement | null],
  'gc.ui.render.panel': [[], ReactElement | null],
  'gc.ui.render.statusBar': [[], ReactElement | null],

  'gc.openView': [[number, boolean] | [number], Promise<void>],
  'gc.loadView': [[number], Promise<ViewDataCore>],
  'gc.switchIstance': [[number, number] | [number], void],
  'gc.createMetadata': [[number] | [], { metadataList: Metadata[], propTaskList: PropTask[] }],
  'gc.createResource': [[number] | [], { resourceList: Resource[], resourceTaskList: ResourceTask[], resourceConfigList: ResourceConfig[] }],
  'gc.pushMetadata': [[] | [number] | [], void],
  'gc.pushResource': [[number] | [], void],
  'gc.stageRefresh': [[string, ViewDataCore, Function] | [string, ViewDataCore], void],
  'gc.unloadView': [[number], void],
  'gc.navRelease': [[number] | [number, number], void],
  'gc.selectInstance': [[number], void],

  'gc.openComponent': [[number], Promise<void>],
  'gc.loadComponent': [[number], Promise<ViewDataCore>],
  'gc.navSolution': [[number] | [number, number], void],

  'gc.removeChildInstance': [[number, number, string | null], Promise<void>],
  'gc.addChildInstance': [[DragAddComponentPong], Promise<void>]
}

export type GrootStateDict = {
  'gs.ui.viewMap': [Map<string, ViewItem>, false],
  'gs.ui.viewContainerMap': [Map<string, ViewContainerItem>, false],

  'gs.ui.style.container': [React.CSSProperties, false],
  'gs.ui.style.banner': [React.CSSProperties, false],
  'gs.ui.style.activityBar': [React.CSSProperties, false],
  'gs.ui.style.primarySidebar': [React.CSSProperties, false],
  'gs.ui.style.secondarySidebar': [React.CSSProperties, false],
  'gs.ui.style.stage': [React.CSSProperties, false],
  'gs.ui.style.panel': [React.CSSProperties, false],
  'gs.ui.style.statusBar': [React.CSSProperties, false],

  'gs.ui.activityBar.viewContainers': [Set<string>, false],
  'gs.ui.activityBar.active': [string, false],
  'gs.ui.primarySidebar.active': [string, false],
  'gs.ui.secondarySidebar.active': [string, false],
  'gs.ui.stage.active': [string, false],
  'gs.ui.panel.viewContainers': [Set<string>, false],
  'gs.ui.panel.active': [string, false],
  'gs.ui.stage.viewport': ['desktop' | 'mobile', false],
  'gs.ui.banner.viewMap': [Map<string, { id: string, placement: 'left' | 'center' | 'right' }>, false],
  // 'gs.ui.propSettingViews': [{ name: string, remotePackage: string, remoteUrl: string, remoteModule: string }, true],

  'gs.app': [Application, false],
  'gs.release': [Release, false],
  'gs.viewList': [View, true],
  'gs.globalResourceList': [Resource, true],
  'gs.globalResourceConfigList': [ResourceConfig, true],
  'gs.view': [View, false],
  'gs.localResourceList': [Resource, true],
  'gs.localResourceConfigList': [ResourceConfig, true],
  'gs.activeComponentInstance': [ComponentInstance, false],

  'gs.solution': [Solution, false],
  'gs.component': [Component, false],

  'gs.propTree': [PropGroup, true],
  'gs.activePropGroupId': [number, false],

  'gs.stage.playgroundPath': [string, false],
  'gs.stage.debugBaseUrl': [string, false],

  'gs.propItem.viewTypeMap': [Map<string, { label: string }>, false],
  'gs.propItem.formRenderList': [{ viewType: string, render: React.FC<FormItemRender> }, true],
  'gs.propItem.settingRenderList': [{ viewType: string, render: React.FC<FormItemRender> }, true],
  'gs.propSetting.breadcrumbList': [{ id: number, name: string }, true],
}

export type GrootHookDict = {
  'gh.allReady': [[], void],
  'gh.sidebar.dragStart': [[], void],
  'gh.sidebar.dragEnd': [[], void],
  'gh.component.dragStart': [[], void],
  'gh.component.dragEnd': [[], void],


  [PostMessageType.InnerReady]: [[], void],
  [PostMessageType.OuterSetConfig]: [[IframeDebuggerConfig] | [], void],
  [PostMessageType.InnerFetchApplication]: [[], void],
  [PostMessageType.OuterSetApplication]: [[ApplicationData] | [], void],
  [PostMessageType.InnerApplicationReady]: [[], void],
  [PostMessageType.InnerFetchView]: [[string], void],
  [PostMessageType.OuterSetView]: [[{ viewKey: string } & ViewDataCore], void],
  [PostMessageType.OuterUpdateResource]: [[{ resourceList: Resource[], resourceTaskList: ResourceTask[], resourceConfigList: ResourceConfig[], viewKey: string }], void],
  [PostMessageType.OuterUpdateComponent]: [[{ metadataList: Metadata[], propTaskList: PropTask[], viewKey: string }], void],

  [PostMessageType.OuterDragAddComponentEnter]: [[], void],
  [PostMessageType.OuterDragAddComponentOver]: [[{ positionX: number, positionY: number }], void],
  [PostMessageType.InnerDragRefreshCursor]: [[DragCursor], void],
  [PostMessageType.OuterDragAddComponentDrop]: [[DragAddComponentPing], void],
  [PostMessageType.InnerDragHitSlot]: [[DragAddComponentPong], void],
  [PostMessageType.OuterDragAddComponentLeave]: [[], void],

  [PostMessageType.InnerOutlineHover]: [[ComponentAnchor], void],
  [PostMessageType.InnerOutlineSelect]: [[ComponentAnchor], void],
  [PostMessageType.InnerOutlineUpdate]: [[{ selected: ComponentAnchor, hover: ComponentAnchor }], void],

  [PostMessageType.OuterComponentSelect]: [[number], void],
  [PostMessageType.OuterOutlineReset]: [['hover' | 'selected'] | [], void],

  [PostMessageType.OuterRefreshView]: [[string], void]
}

export type ViewContainerItem = {
  id: string,
  name: ViewElement,
  icon?: ViewElement,
  view?: ViewElement,
  toolbar?: ViewElement
};

export type ViewItem = {
  parent?: string
} & ViewContainerItem;



export type ViewElement = string | ReactElement | React.FC<any>;














export const iframeNamePrefix = 'groot_';

/**
 * 设计模式下宿主传递给iframe的配置信息
 */
export type IframeDebuggerConfig = {
  runtimeConfig?: Partial<UIManagerConfig>,
  controlView?: string,
}

export enum PostMessageType {

  InnerReady = 'inner_ready',
  OuterSetConfig = 'outer_set_config',
  InnerFetchApplication = 'inner_fetch_application',
  OuterSetApplication = 'outer_set_application',
  InnerApplicationReady = 'inner_application_ready',
  SwitchView = 'switch_view',
  InnerFetchView = 'inner_fetch_view',
  OuterSetView = 'outer_set_view',
  OuterUpdateResource = 'outer_update_resource',
  OuterUpdateComponent = 'outer_update_component',
  OuterRefreshView = 'outer_refresh_view',

  OuterDragAddComponentEnter = 'outer_drag_add_component_enter',
  OuterDragAddComponentOver = 'outer_drag_add_component_over',
  OuterDragAddComponentLeave = 'outer_drag_add_component_leave',
  OuterDragAddComponentDrop = 'outer_drag_add_component_drop',
  InnerDragHitSlot = 'inner_drag_hit_slot',
  InnerDragRefreshCursor = 'inner_drag_refresh_cursor',

  InnerOutlineHover = 'inner_outline_hover',
  InnerOutlineSelect = 'inner_outline_Select',
  InnerOutlineUpdate = 'inner_outline_update',
  OuterOutlineReset = 'outer_outline_reset',
  OuterComponentSelect = 'outer_component_select',
}












export type DragAddComponentPing = {
  positionX: number,
  positionY: number,
  componentId: number,
  solutionComponentId: number,
  componentVersionId: number,
  solutionVersionId: number
}

// todo 需要和PropMetadataData.$$runtime 类型对齐
export type DragAddComponentPong = {
  propItemId: number,
  abstractValueIdChain?: string,
  parentInstanceId: number
  componentId: number,
  currentInstanceId?: number,
  solutionInstanceId: number,
  componentVersionId: number,
  solutionComponentId: number,
  direction?: 'next' | 'pre'
}

export type ComponentAnchor = {
  clientRect: DOMRect,
  tagName: string,
  instanceId: number,
  parentInstanceId?: number,
  viewId: number,
  propItemId?: number,
  abstractValueIdChain?: string
}

export type DragCursor = {
  direction: 'bottom' | 'top',
  left: number,
  width: number,
  top: number,
  hitEle?: HTMLElement,
  slotRect: DOMRect
}







export type ExtScriptModule<P = any> = {
  id: number,
  check: (params: P) => ExtensionPipelineLevel,
  exec: (params: P) => boolean
}


export type ExtensionHandler = {
  /**
   * extInstanceId: extInstance
   */
  appExt: Map<number, { instance: ExtensionInstance, extId: number, extAssetUrl: string }>,
  /**
   * viewId: {solutionId: {extInstanceId: extInstance}}
   */
  solutionExt: Map<number, Map<number, Map<number, { instance: ExtensionInstance, extId: number, extAssetUrl: string }>>>,
  /**
   * viewId: {extInstanceId: extInstance}
   */
  viewExt: Map<number, Map<number, { instance: ExtensionInstance, extId: number, extAssetUrl: string }>>,

  runtime: {
    /**
     * extId: ...
     */
    extByIdMap: Map<number, { referCount: number, extId: number, extInstance: ExtensionInstance }>,
    /**
     * extVersionUrl: extId
     */
    extByAssetUrlMap: Map<string, number>,
  },
  getPipeline: GetPipeline,
  install: (params: { extInstance: ExtensionInstance, level: ExtensionLevel, extId: number, extAssetUrl: string, solutionId?: number, viewId?: number }) => boolean,
  uninstall: (params: { extInstanceId: number, level: ExtensionLevel, solutionId?: number, viewId?: number }) => boolean
}

interface GetPipeline {
  (type: 'propItem' | 'resource', level: ExtensionLevel.Application): ExtScriptModule[];
  (type: 'propItem' | 'resource', level: ExtensionLevel.View, viewId: number): ExtScriptModule[];
  (type: 'propItem' | 'resource', level: ExtensionLevel.Solution, viewId: number, solutionId?: number): ExtScriptModule[];
}

export type FormItemRender = {
  propItem: PropItem,
  simplify: boolean,
  formItemProps: any
}

export type PropItemPipelineParams = {
  ctx: Record<string, any>,
  propKey: string,
  value: any,
  propItem: PropItem,
  metadata: Metadata,
  propKeyChain: string,
  defaultFn: () => void,
  valueInterpolation: boolean,
  appendTask: (taskName: string, taskCode: string, initCode: string, destoryCode: string) => void
}

export type ResourcePipelineParams = {
  resource: Resource,
  defaultFn: () => void,
  local: boolean,
  appendTask: (taskName: string, taskCode: string, initCode: string, destoryCode: string) => void
}

export type ResourceTask = {
  key: string,
  main: string,
  init: string,
  destory: string,
  storage?: any,
  mainFn?: (_rawValue: string, _resource: Resource, _config: ResourceConfig, _refresh: () => void, _groot: GrootType, _shared: Record<string, any>, _storage: any) => { get?(): any; set?(v: any): void },
  initFn?: (_groot: GrootType, _shared: Record<string, any>) => any,
  destoryFn?: (_groot: GrootType, _shared: Record<string, any>, _storage: any) => void
}

export type PropTask = {
  key: string,
  main: string,
  init: string,
  destory: string,
  storage?: any,
  mainFn?: (_rawValue: string, _props: Record<string, any>, _groot: GrootType, _shared: Record<string, any>, _storage: any) => any,
  initFn?: (_groot: GrootType, _shared: Record<string, any>) => any,
  destoryFn?: (_groot: GrootType, _shared: Record<string, any>, _storage: any) => void
}

export const resourceAppendTask = (resource: Resource, taskList: ResourceTask[]) => {
  return (taskName: string, taskCode, initCode: string, destoryCode: string) => {
    resource.taskName = taskName
    taskList.push({ key: taskName, main: taskCode, init: initCode, destory: destoryCode })
  }
}

export const propAppendTask = (metadata: Metadata, taskList: PropTask[], propKeyChain: string) => {
  return (taskName: string, taskCode: string, initCode: string, destoryCode: string) => {
    metadata.advancedProps.push({
      keyChain: propKeyChain,
      type: taskName
    })
    taskList.push({ key: taskName, main: taskCode, init: initCode, destory: destoryCode })
  }
}