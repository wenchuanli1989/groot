import { EntityManager, Utils, wrap } from '@mikro-orm/core';
import { AutoPath } from '@mikro-orm/core/typings';

export function omitProps<O, P extends string>(instance: O, propKeys: AutoPath<O, P>[]) {

  if (!instance) {
    throw new Error('instance can not null');
  }

  const stripKeysOfObj = new Map();

  for (let i = 0; i < propKeys.length; i++) {
    const stageKeys = propKeys[i].split('.');
    let context: any = instance;

    let indexOfStageKeysStack = [];
    let arrayContextStack = [];
    // 数组迭代的索引
    let arrayContextIndexStack = [];

    let currArrayContextIndex = -1;
    let currArrayContext;
    let currIndexOfStageKeys = -1;
    for (let indexOfStageKeys = 0; indexOfStageKeys < stageKeys.length; indexOfStageKeys++) {
      const key = stageKeys[indexOfStageKeys];

      // 最后一个属性
      if (indexOfStageKeys === stageKeys.length - 1) {
        if (context) {
          if (stripKeysOfObj.has(context)) {
            stripKeysOfObj.get(context).push(key);
          } else {
            stripKeysOfObj.set(context, [key]);
          }
        }

        // 属性上层有数组结构
        if (currArrayContext) {
          // 数组最后一个
          if (currArrayContextIndex === currArrayContext.length - 1) {
            currIndexOfStageKeys = indexOfStageKeysStack.pop();
            currArrayContext = arrayContextStack.pop();
            currArrayContextIndex = arrayContextIndexStack.pop();

            // 最终
            if (!currArrayContext) {
              break;
            }
          }

          context = currArrayContext[++currArrayContextIndex];
          indexOfStageKeys = currIndexOfStageKeys;
        }

        if (!context) {
          break;
        }

        continue;
      }

      context = context[key];

      if (!context) {
        indexOfStageKeys = stageKeys.length - 2;
        continue;
      }

      // 数组
      if (Number.isInteger(context.length)) {
        if (context.length === 0) {
          indexOfStageKeys = stageKeys.length - 2;
          continue;
        }

        if (currArrayContext) {
          arrayContextStack.push(currArrayContext);
          arrayContextIndexStack.push(currArrayContextIndex);
          indexOfStageKeysStack.push(currIndexOfStageKeys);
        }

        currArrayContext = context;
        currArrayContextIndex = 0;
        currIndexOfStageKeys = indexOfStageKeys;

        context = currArrayContext[currArrayContextIndex];
      }

    }
  }

  stripKeysOfObj.forEach((keys, obj) => {
    obj.toJSON = wrapToJSON(keys);
  })
}


function wrapToJSON(keys: string[]) {
  function toJSON(this: any, ...args: any[]) {
    let obj;

    // 不需要处理 persist: false的实例
    if (Utils.isEntity(this)) {
      obj = wrap(this).toObject(...args);
    } else {
      obj = this;
    }

    keys.forEach(key => {
      delete obj[key]
    });

    return obj;
  }

  return toJSON;
}

// 校验字符串代表的属性是否在类型下存在
// type AutoPath<O, P extends string> = (P extends `${infer A}.${infer B}` ?
//   (A extends StringKeys<O> ? `${A}.${AutoPath<GetStringKey<O, A>, B>}` : never)
//   :
//   (P extends StringKeys<O> ?
//     (
//       (GetStringKey<O, P> extends unknown ? Exclude<P, `${string}.`> : never)
//       |
//       (StringKeys<GetStringKey<O, P>> extends never ? never : `${P}.`)
//     )
//     :
//     StringKeys<O>
//   )
// );

// type GetStringKey<T, K> = K extends keyof T ? ExtractType<T[K]> : never;

// type StringKeys<T> = `${Exclude<keyof ExtractType<T>, symbol>}`;

// type Loadable<T> = Collection<T, any> | Reference<T> | T[];

// type ExtractType<T> = T extends Loadable<infer U> ? U : T;

