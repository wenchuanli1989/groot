import { isBaseType, isNativeType } from './util';


const ArrayPatchMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill'];


/**
 * 检测对象属性变化
 */
export function wrapperState(target: any, listener: Function) {
  if (isNativeType(target)) {
    throw new Error('不能使用原生引用类型')
  }
  let terminate = false;

  const cancel = () => {
    terminate = true
  }

  // 避免不必类型的包装
  if (isBaseType(target) || typeof target === 'function' || target.$$typeof) {
    return [target, cancel];
  }

  // 防止重复多余的包装
  if (target.__groot_origin_listener === listener) {
    return [target, cancel];
  }

  ++wrapCount
  const proxyObj = new Proxy(target, {
    get(oTarget, sKey, receiver) {
      if (terminate) {
        return Reflect.get(oTarget, sKey, receiver);
      }

      // 原生内置方法调用或者react dom对象跳过
      if (typeof sKey === 'symbol' || sKey === '$$typeof' || sKey === 'constructor') {
        return Reflect.get(oTarget, sKey);
      } else if (sKey === '__groot_origin') {
        return oTarget;
      } else if (sKey === '__groot_origin_listener') {
        return listener
      }

      ++getCount;
      if (!keyState[sKey]) {
        keyState[sKey] = 1;
      } else {
        keyState[sKey]++;
      }

      const value = Reflect.get(oTarget, sKey);
      // 基本数据类型直接放行
      if (isBaseType(value)) {
        return value;
      }

      if (typeof value === 'function') {

        // 拦截可以改变数组自身的方法
        if (Array.isArray(oTarget) && ArrayPatchMethods.includes(sKey)) {
          return (...args: any[]) => {
            if (terminate) {
              return Reflect.apply(value, receiver, args);
            }

            const result = Reflect.apply(value, receiver, args);
            listener(`Array method ${sKey}`);
            return result;
          }
        }

        return value.bind(receiver);

      } else {
        // React.Element不做任何处理
        if (value.$$typeof) {
          return value;
        }
        // 除函数之外引用应用类型需要递归包裹生成代理对象
        return wrapperState(value, listener)[0];
      }
    },
    set(oTarget, sKey, vValue, receiver) {
      if (terminate) {
        return Reflect.set(oTarget, sKey, vValue, receiver);
      }

      ++setCount;
      const result = Reflect.set(oTarget, sKey, vValue);
      listener(`set key ${sKey.toString()}`);
      return result;
    },
    deleteProperty(oTarget, sKey) {
      if (terminate) {
        return Reflect.deleteProperty(oTarget, sKey);
      }

      ++setCount;
      const result = Reflect.deleteProperty(oTarget, sKey);
      listener(`delete key ${sKey.toString()}`);
      return result;
    },
  })

  return [proxyObj, cancel]
}


export const getOrigin = (target) => {
  let data = target;
  while (data && data.__groot_origin) {
    data = data.__groot_origin
  }

  if (data && Array.isArray(data)) {
    return data.map(item => getOrigin(item))
  }

  return data;
}


let getCount = 0;
let setCount = 0;
let wrapCount = 0;
let keyState = {};
let debug = false
if (debug) {
  const monitor = () => {
    console.log(`getCount: ${getCount}`)
    console.log(`setCount: ${setCount}`)
    console.log(`wrapCount: ${wrapCount}`)
    console.dir(keyState)

    setTimeout(monitor, 3000)
  }

  monitor();
}