import { CommandManager, createExtensionHandler, ExtensionLevel, ExtensionRuntime, ExtensionStatus, ExtScriptModule, GridLayout, GrootContextCallHook, GrootContextExecuteCommand, GrootContextGetState, GrootContextParams, GrootContextRegisterCommand, GrootContextRegisterHook, GrootContextRegisterState, GrootContextSetState, GrootContextUseStateByName, GrootContextWatchState, HookManager, isBaseType, loadRemoteModule, MainFunction, StateManager, wrapperState } from "@grootio/common"
import { useEffect, useReducer } from "react";
import request from "util/request";

const commandMap = new Map<string, CommandObject>();
const stateMap = new Map<string, StateObject>();
const hookMap = new Map<string, { preArgs?: any[], list: HookObject[] }>();
let registorReady = false;
let __provider: string;
let _grootParams: GrootContextParams, _grootLayout: GridLayout, _extProcess: Function

export const extHandler = createExtensionHandler()

export const setGrootContext = (grootParams: GrootContextParams, grootLayout: GridLayout, extProcess: (ext: ExtensionRuntime) => void) => {
  _grootParams = grootParams
  _grootLayout = grootLayout
  _extProcess = extProcess
}


export const loadExtension = ({ remoteExtensionList, extLevel, entryId, solutionId }: { remoteExtensionList: ExtensionRuntime[], extLevel: ExtensionLevel, entryId?: number, solutionId?: number }) => {
  remoteExtensionList.forEach(extInstance => {
    extHandler.install({ extInstance, level: extLevel, solutionId, entryId, extId: extInstance.extension.id, extAssetUrl: extInstance.extensionVersion.assetUrl })
  })
  return Promise.all(remoteExtensionList.map(extInstance => {
    if (extInstance.status === ExtensionStatus.Active && extInstance.extensionVersion.assetUrl) {
      const { assetUrl, packageName, moduleName } = extInstance.extensionVersion
      return loadRemoteModule(packageName, moduleName, assetUrl)
    } else {
      return Promise.resolve()
    }
  })).then(extModuleList => {
    remoteExtensionList.forEach((_, index) => {
      remoteExtensionList[index].main = extModuleList[index]?.default
    })
  })
}

export const launchExtension = (remoteExtensionList: ExtensionRuntime[], level: ExtensionLevel) => {
  registorReady = false;

  const readyCallbackList: Function[] = []

  remoteExtensionList.filter(item => item.status === ExtensionStatus.Active).forEach((extInstance) => {
    extInstance.level = level;

    // 对插件的特殊处理
    _extProcess(extInstance)

    if (extInstance.main) {
      const requestClone = request.clone((type) => {
        if (type === 'request') {
          const { name, packageName, moduleName } = extInstance.extensionVersion
          console.log(`[ext: ${name} ${packageName}/${moduleName} request]`);
        }
      });

      __provider = `ext:${extInstance.id}`;
      const configSchema = extInstance.main({
        extension: extInstance,
        params: _grootParams,
        layout: _grootLayout,
        request: requestClone,
        groot: {
          extHandler,
          loadExtension,
          launchExtension,
          stateManager,
          commandManager,
          hookManager,
          onReady: function (callback) {
            readyCallbackList.push(callback)
          }
        }
      });
      __provider = undefined;

      extInstance.configSchema = configSchema;
    }
  });

  registorReady = true;
  readyCallbackList.forEach(callback => {
    callback()
  })
}

const registerCommand: GrootContextRegisterCommand<Record<string, [any[], any]>> = (command, callback) => {
  if (registorReady) {
    throw new Error('命令系统已准备完成，不可再次注册命令');
  }
  let originCommand;
  if (commandMap.has(command)) {
    originCommand = commandMap.get(command);
    console.warn(`命令:${String(command)} 已经存在`);
  }
  commandMap.set(command, {
    callback,
    provider: __provider,
    origin: originCommand
  });
  return () => {
    if (commandMap.has(command) && commandMap.get(command).callback !== callback) {
      console.warn(`命令:${String(command)} 已经被覆盖`)
    } else {
      commandMap.delete(command);
    }
  }
}

export const executeCommand: GrootContextExecuteCommand<Record<string, [any[], any]>> = (command, ...args) => {
  if (!registorReady) {
    throw new Error(`命令系统未准备就绪`)
  }
  if (!commandMap.has(command)) {
    throw new Error(`命令:${String(command)} 未找到`)
  }
  const commandData = commandMap.get(command);
  const { callback, origin } = commandData
  const originCommand = origin || (() => undefined);
  const result = callback.apply(null, [originCommand, ...args]);
  // todo hookName
  return result;
}


const registerState: GrootContextRegisterState<Record<string, [any, boolean]>> = (name, defaultValue, multi, onChange) => {
  if (registorReady) {
    throw new Error('状态系统已准备完成，不可再次注册状态');
  }

  const originState = stateMap.get(name);

  if (originState) {
    if (onChange) {
      originState.eventTarget.addEventListener('change', (event) => {
        if (!registorReady) return;

        onChange(originState.value, (event as any).detail as any);
      })
    }


    if (multi) {
      const arr = (defaultValue || []) as any[]
      originState.value.push(...arr)
    } else {
      // 切断对原有对象监听
      originState.cancel()

      const [stateValue, cancel] = wrapperState(defaultValue, (reason, directChange) => {
        const event = new CustomEvent('change', {
          detail: { reason, directChange }
        })
        originState.eventTarget.dispatchEvent(event)
      })
      originState.value = stateValue
      originState.cancel = cancel

      console.warn(`状态:${name} 已被覆盖`);
    }
  } else {
    const eventTarget = new EventTarget();
    if (onChange) {
      eventTarget.addEventListener('change', (event) => {
        if (!registorReady) return;

        onChange(stateMap.get(name).value, (event as any).detail as any);
      })
    }

    const [stateValue, cancel] = wrapperState(defaultValue, (reason, directChange) => {
      const event = new CustomEvent('change', {
        detail: { reason, directChange }
      })
      eventTarget.dispatchEvent(event)
    })

    stateMap.set(name, {
      value: stateValue,
      provider: __provider,
      eventTarget,
      multi,
      cancel
    });
  }

  return !!originState;
}

const getState: GrootContextGetState<Record<string, [any, boolean]>> = (name) => {
  if (!stateMap.get(name)) {
    console.warn(`状态:${name} 未找到`)
  }

  const stateData = stateMap.get(name);
  return stateData.value;
}

const watchState: GrootContextWatchState<Record<string, [any, boolean]>> = (name, callback) => {
  if (!stateMap.get(name)) {
    console.warn(`状态:${name} 未找到`)
  }

  const stateData = stateMap.get(name);
  const listener = (event) => {
    callback(stateMap.get(name).value, event.detail);
  }
  stateData.eventTarget.addEventListener('change', listener)

  return () => {
    stateData.eventTarget.removeEventListener('change', listener)
  }
}

const setState: GrootContextSetState<Record<string, [any, boolean]>> = (name, newValue) => {
  if (!registorReady) {
    throw new Error(`状态系统未准备就绪`)
  }
  if (!stateMap.get(name)) {
    throw new Error(`状态:${name} 未找到`)
  }

  const stateData = stateMap.get(name);
  if (newValue !== stateData.value) {
    if (isBaseType(newValue)) {
      stateData.value = newValue;
    } else {
      stateData.cancel()
      const [proxyObj, cancel] = wrapperState(newValue, (reason, directChange) => {
        const event = new CustomEvent('change', {
          detail: { reason, directChange }
        })
        stateData.eventTarget.dispatchEvent(event)
      })
      stateData.value = proxyObj
      stateData.cancel = cancel
    }

    const event = new CustomEvent('change', {
      detail: { reason: 'setState', directChange: true }
    })
    stateData.eventTarget.dispatchEvent(event)
  }

  return stateData.value;
}

export const useStateByName: GrootContextUseStateByName<Record<string, [any, boolean]>> = (name, defaultValue) => {
  if (!registorReady) {
    const message = `状态系统未准备就绪`
    console.error(message)
    throw new Error(message)
  }
  if (!stateMap.has(name) && (defaultValue === undefined)) {
    const message = `状态:${name} 未找到`;
    console.error(message)
    throw new Error(message)
  }

  const stateObj = stateMap.get(name);

  const [, refresh] = useReducer((tick) => ++tick, 0);

  useEffect(() => {
    stateObj?.eventTarget.addEventListener('change', () => {
      refresh();
    })
  }, [])


  return [
    stateObj?.value || defaultValue,
    (newValue) => {
      return setState(name, newValue);
    }
  ]
}

export const registerHook: GrootContextRegisterHook<Record<string, [any[], any]>> = (hookName, callback, emitPrevArgs = false) => {
  const hook = getOrCreateHook(hookName)

  if (hook.list.find(item => item.callback === callback)) {
    throw new Error('钩子函数重复注册')
  }

  hook.list.push({
    callback,
    provider: __provider
  })

  if (emitPrevArgs && hook.preArgs) {
    callback.apply(null, hook.preArgs as any)
  }

  return () => {
    const index = hook.list.findIndex(item => item.callback === callback);
    if (index !== -1) {
      hook.list.splice(index, 1);
    }
  }
}

export const callHook: GrootContextCallHook<Record<string, [any[], any]>> = (hookName, ...args) => {

  let hook = getOrCreateHook(hookName)
  hook.preArgs = args

  return hook.list.map((item) => {
    return item.callback.apply(null, args);
  })

}

const getOrCreateHook = (hookName: string) => {
  let hook = hookMap.get(hookName)
  if (!hook) {
    hook = {
      list: []
    }
    hookMap.set(hookName, hook);
  }

  return hook
}

export const stateManager: StateManager = () => {
  return {
    registerState,
    setState,
    getState,
    useStateByName,
    watchState
  }
}

export const commandManager: CommandManager = () => {
  return {
    registerCommand,
    executeCommand
  }
}

export const hookManager: HookManager = () => {
  return {
    registerHook,
    callHook
  }
}


export const createExtScriptModule = (code: string) => {
  const newFunction = new window.Function('module', code);
  const module = { exports: {} }
  newFunction(module);

  return module.exports as ExtScriptModule
}

type CommandObject = { callback: Function, provider: string, origin?: CommandObject }
type StateObject = { value: any, provider: string, eventTarget: EventTarget, multi: boolean, cancel: Function }
type HookObject = { callback: Function, provider: string }


// 默认state
registerState('gs.exensionHandle', extHandler, false);