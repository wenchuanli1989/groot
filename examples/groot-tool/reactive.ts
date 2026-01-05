// util.ts
const typeList = ['number', 'string', 'boolean', 'symbol', 'bigInt'];
export const isBaseType = (value: any) => {
  const typeStr = typeof value;
  return typeList.includes(typeStr) || value === null || value === undefined;
};

const getType = (obj: any) => {
  return Object.prototype.toString
    .call(obj)
    .replace(/^\[|\]$/g, '')
    .split(' ')[1];
};
// util.ts

const ArrayPatchMethods = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
  'fill',
];

const MapPatchMethods = ['clear', 'delete', 'set'];
const SetPatchMethods = ['add', 'clear', 'delete'];

/**
 * 检测对象属性变化
 */
export function wrapperState(
  originTarget: any,
  listener: Function,
  originWatch = true
) {
  let terminate = false;

  const cancel = () => {
    terminate = true;
  };

  // 避免不必要包装
  if (
    isBaseType(originTarget) ||
    typeof originTarget === 'function' ||
    originTarget.$$typeof
  ) {
    return [originTarget, cancel];
  }

  // 防止递归时重复多余的包装
  if (originTarget.__groot_origin_listener === listener) {
    return [originTarget, cancel];
  }

  // 用于基准性能测试
  ++wrapCount;
  const proxyObj = new Proxy(originTarget, {
    get(target, key, receiver) {
      return getHandler(
        target,
        key,
        receiver,
        terminate,
        listener,
        originWatch
      );
    },
    set(target, key, value, receiver) {
      if (terminate) {
        return Reflect.set(target, key, value, receiver);
      }

      ++setCount;
      if (Array.isArray(value)) {
        value = value.map((item) => {
          return wrapperState(item, listener, false)[0];
        });
      }
      const result = Reflect.set(target, key, value);
      listener(`set key ${key.toString()}`, originWatch);
      return result;
    },
    deleteProperty(target, key) {
      if (terminate) {
        return Reflect.deleteProperty(target, key);
      }

      ++setCount;
      const result = Reflect.deleteProperty(target, key);
      listener(`delete key ${key.toString()}`, originWatch);
      return result;
    },
  });

  return [proxyObj, cancel];
}

const getHandler = (
  target,
  key,
  receiver,
  terminate,
  listener,
  originWatch
) => {
  if (key === '__groot_origin') {
    return target;
  } else if (key === '__groot_origin_listener') {
    return listener;
  } else if (target instanceof EventTarget) {
    return target;
  }

  const targetType = getType(target);
  const specialTargetType = targetType === 'Map' || targetType === 'Set';
  const value = specialTargetType
    ? target[key]
    : Reflect.get(target, key, receiver);
  if (terminate) {
    return value;
  } else if (typeof key === 'symbol' || key === 'constructor') {
    // 原生内置方法调用或者react dom对象跳过
    return value;
  } else if (isBaseType(value)) {
    // 基本数据类型直接放行
    return value;
  }
  if (value instanceof EventTarget) {
    return value;
  }

  // 用于基准性能测试
  ++getCount;
  keyHitCount[key] = (+keyHitCount[key] || 0) + 1;

  if (typeof value === 'function') {
    // 拦截原始引用类型自身的方法
    if (
      targetType === 'Array' ||
      targetType === 'Map' ||
      targetType === 'Set'
    ) {
      if (
        ArrayPatchMethods.includes(key) ||
        MapPatchMethods.includes(key) ||
        SetPatchMethods.includes(key)
      ) {
        // 进行特殊包装
        return (...args: any[]) => {
          // 在原始对象上执行方法，避免报错
          const result = value.apply(getOrigin(target), args);
          listener(`${target} method ${key}`, originWatch);
          return result;
        };
      }

      if (targetType === 'Array') {
        const newTarget = getOrigin(target).map((item) => {
          return wrapperState(item, listener, false)[0];
        });
        return value.bind(newTarget);
      } else {
        // todo 有可能无法更新的问题
        // 在原始对象上执行方法，避免报错
        return value.bind(getOrigin(target));
      }
    }

    // 确保方法执行时this上下文是代理对象
    return value.bind(receiver);
  } else {
    // React.Element不做任何处理
    if (value.$$typeof) {
      return value;
    }
    // 除函数之外引用应用类型需要递归包裹生成代理对象
    return wrapperState(value, listener, false)[0];
  }
};

export const getOrigin = (target) => {
  let data = target;
  while (!!data?.__groot_origin) {
    data = data.__groot_origin;
  }

  return data;
};

let getCount = 0;
let setCount = 0;
let wrapCount = 0;
let keyHitCount = {};
let debug = false;
if (debug) {
  const monitor = () => {
    console.log(`getCount: ${getCount}`);
    console.log(`setCount: ${setCount}`);
    console.log(`wrapCount: ${wrapCount}`);
    console.dir(keyHitCount);

    setTimeout(monitor, 3000);
  };

  monitor();
}
