import React from "react";
import { ViewElement } from "./extension";

// 从对象中抓取部分属性生成另一个对象
export function pick<O extends Object, P extends string>(obj: O, props: AutoPath<O, P>[], target?: O): O {
  const newObj = target || {} as O;

  Object.keys(obj).forEach(function (key) {
    if (props.includes('**' as any) || props.includes(key as any)) {
      if (obj[key] !== null && obj[key] !== undefined) {
        newObj[key] = obj[key];
      }
    }
    if (props.includes(('-' + key) as any)) {
      delete newObj[key];
    }
  });

  return newObj;
}




// 校验字符串代表的属性是否在类型下存在
export type AutoPath<O, P> = P extends string ?

  ((P & `${string}.` extends never ? P : P & `${string}.`) extends infer Q ?

    (Q extends `${infer A}.${infer B}` ?

      (A extends StringKeyOf<O> ? `${A}.${AutoPath<GetKeyType<O, A>, B>}` : never)
      :
      (Q extends StringKeyOf<O> ? P : StringKeyOf<O>))

    : never)

  : never;

type StringKeyOf<T, E extends string = never> =
  T extends Array<any> ? ConvertArray<T> : (T extends object ? `${Exclude<keyof T | '**' | WrapMinus<keyof T> | E, symbol>}` : never)

type GetKeyType<T, K> = K extends keyof T ? ConvertArray<T[K]> : never;

type ConvertArray<T> = T extends Array<infer U> ? ConvertArray<U> : T;

type WrapMinus<T> = T extends string ? `-${T}` : never;


const typeList = ['number', 'string', 'boolean', 'symbol', 'bigInt'];
export const isBaseType = (value: any) => {
  const typeStr = typeof value;
  return typeList.includes(typeStr) || value === null || value === undefined
}

export const isNativeType = (value: any) => {
  return ['[object Map]', '[object Set]', '[object Date]'].includes(Object.prototype.toString.call(value))
}

export const viewRender = (view: ViewElement, props?: any) => {
  if (typeof view === 'function') {
    return React.createElement(view, props || {})
  } else {
    return React.createElement(React.Fragment, props || {}, view)
  }
}

export const interpolationRegExp = /\{\{(\s*)([^}]+?)(\s*)\}\}/mg
export const interpolationRegExpSingle = new RegExp(interpolationRegExp.source)