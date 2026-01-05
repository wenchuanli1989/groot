import { useEffect, useReducer } from 'react';
import { isBaseType, wrapperState } from './reactive'

type GrootContextGetState<ST extends Record<string, [any, boolean]>> = <
  K extends keyof ST & string,
  T extends ST[K][0],
  B extends ST[K][1],
  R extends B extends true ? T[] : T
>(
  name: K
) => R;

type GrootContextRegisterState<ST extends Record<string, [any, boolean]>> = <
  K extends keyof ST & string,
  T extends ST[K][0],
  B extends ST[K][1],
  D extends B extends true ? T[] : T,
  N extends D
>(
  name: K,
  defaultValue: D,
  multi: B,
  onChange?: (
    newValue: N,
    event: { reason: string; directChange: boolean }
  ) => void
) => boolean;

type GrootContextSetState<ST extends Record<string, [any, boolean]>> = <
  K extends keyof ST & string,
  T extends ST[K][0],
  B extends ST[K][1],
  V extends B extends true ? T[] : T
>(
  name: K,
  value: V
) => V;

type GrootContextUseStateByName<ST extends Record<string, [any, boolean]>> = <
  K extends keyof ST & string,
  T extends ST[K][0],
  B extends ST[K][1],
  R extends B extends true ? T[] : T,
  N extends R,
  D extends R
>(
  name: K,
  defaultValue?: D
) => [R, (newValue: N) => R];

type GrootContextWatchState<ST extends Record<string, [any, boolean]>> = <
  K extends keyof ST & string,
  T extends ST[K][0],
  B extends ST[K][1],
  N extends B extends true ? T[] : T
>(
  name: K,
  onChange: (
    newValue: N,
    event: { reason: string; directChange: boolean }
  ) => void
) => Function;

type StateObject = {
  value: any;
  provider: string;
  eventTarget: EventTarget;
  multi: boolean;
  cancel: Function;
};

const stateMap = new Map<string, StateObject>();

let registorReady = false;
let __provider = '';

export const setRegistorReady = (ready: boolean) => {
  registorReady = ready;
};

export const registerState: GrootContextRegisterState<
  Record<string, [any, boolean]>
> = (name, defaultValue, multi, onChange) => {
  if (registorReady) {
    throw new Error('状态系统已准备完成，不可再次注册状态');
  }

  const originState = stateMap.get(name);

  if (originState) {
    if (onChange) {
      originState.eventTarget.addEventListener('change', (event) => {
        if (!registorReady) return;

        onChange(originState.value, (event as any).detail as any);
      });
    }

    if (multi) {
      const arr = (defaultValue || []) as any[];
      originState.value.push(...arr);
    } else {
      // 切断对原有对象监听
      originState.cancel();

      const [stateValue, cancel] = wrapperState(
        defaultValue,
        (reason: any, directChange: any) => {
          const event = new CustomEvent('change', {
            detail: { reason, directChange },
          });
          originState.eventTarget.dispatchEvent(event);
        }
      );
      originState.value = stateValue;
      originState.cancel = cancel;

      console.warn(`状态:${name} 已被覆盖`);
    }
  } else {
    const eventTarget = new EventTarget();
    if (onChange) {
      eventTarget.addEventListener('change', (event) => {
        if (!registorReady) return;

        onChange(stateMap.get(name)!.value, (event as any).detail as any);
      });
    }

    const [stateValue, cancel] = wrapperState(
      defaultValue,
      (reason: any, directChange: any) => {
        const event = new CustomEvent('change', {
          detail: { reason, directChange },
        });
        eventTarget.dispatchEvent(event);
      }
    );

    stateMap.set(name, {
      value: stateValue,
      provider: __provider,
      eventTarget,
      multi,
      cancel,
    });
  }

  return !!originState;
};

export const getState: GrootContextGetState<Record<string, [any, boolean]>> = (
  name
) => {
  if (!stateMap.get(name)) {
    console.warn(`状态:${name} 未找到`);
  }

  const stateData = stateMap.get(name);
  return stateData?.value;
};

export const watchState: GrootContextWatchState<
  Record<string, [any, boolean]>
> = (name, callback) => {
  if (!stateMap.get(name)) {
    console.warn(`状态:${name} 未找到`);
  }

  const stateData = stateMap.get(name)!;
  const listener = (event: any) => {
    callback(stateMap.get(name)!.value, event.detail);
  };
  stateData.eventTarget.addEventListener('change', listener);

  return () => {
    stateData.eventTarget.removeEventListener('change', listener);
  };
};

export const setState: GrootContextSetState<Record<string, [any, boolean]>> = (
  name,
  newValue
) => {
  if (!registorReady) {
    throw new Error(`状态系统未准备就绪`);
  }
  if (!stateMap.get(name)) {
    throw new Error(`状态:${name} 未找到`);
  }

  const stateData = stateMap.get(name)!;
  if (newValue !== stateData.value) {
    if (isBaseType(newValue)) {
      stateData.value = newValue;
    } else {
      stateData.cancel();
      const [proxyObj, cancel] = wrapperState(
        newValue,
        (reason: any, directChange: any) => {
          const event = new CustomEvent('change', {
            detail: { reason, directChange },
          });
          stateData.eventTarget.dispatchEvent(event);
        }
      );
      stateData.value = proxyObj;
      stateData.cancel = cancel;
    }

    const event = new CustomEvent('change', {
      detail: { reason: 'setState', directChange: true },
    });
    stateData.eventTarget.dispatchEvent(event);
  }

  return stateData.value;
};

export const useStateByName: GrootContextUseStateByName<
  Record<string, [any, boolean]>
> = (name, defaultValue) => {
  if (!registorReady) {
    const message = `状态系统未准备就绪`;
    console.error(message);
    throw new Error(message);
  }
  if (!stateMap.has(name) && defaultValue === undefined) {
    const message = `状态:${name} 未找到`;
    console.error(message);
    throw new Error(message);
  }

  const stateObj = stateMap.get(name);

  const [, refresh] = useReducer((tick) => ++tick, 0);

  useEffect(() => {
    stateObj?.eventTarget.addEventListener('change', () => {
      refresh();
    });
  }, []);

  return [
    stateObj?.value || defaultValue,
    (newValue) => {
      return setState(name, newValue);
    },
  ];
};
