import { ExtensionContext, PropItem, StudioMode, ViewDataCore } from "@grootio/common"

let _context: ExtensionContext;

export const getContext = () => {
  return _context;
}

export const setContext = (context: ExtensionContext) => {
  _context = context;
}

export const grootManager = {
  get state() {
    return _context.groot.stateManager();
  },
  get command() {
    return _context.groot.commandManager();
  },
  get hook() {
    return _context.groot.hookManager();
  }
}


export const isPrototypeMode = () => {
  return _context.params.mode === StudioMode.Prototype;
}

export const commandBridge = {
  stageRefresh: (viewKey: string, data: ViewDataCore, callback: Function): void => {
    throw new Error('方法未实现')
  },
  pushPropItemToStack: (propItem: PropItem): void => {
    throw new Error('方法未实现')
  }
}