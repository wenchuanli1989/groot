import { interpolationRegExp } from "@grootio/common";
import { resourceManager } from "./resource";

export const wrapperProp = (target) => {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key);
      if (typeof value !== 'string' || !interpolationRegExp.test(value)) {
        return Reflect.get(target, key, receiver);
      }

      const matchGroup = value.match(interpolationRegExp)
      if (matchGroup[0] === value.trim()) {
        return expression(interpolationRegExp.exec(matchGroup[0])[2])
      }

      return value.replace(interpolationRegExp, (matchStr) => {
        return expression(interpolationRegExp.exec(matchStr)[2])
      })

    }
  })
}

function expression(code: string) {

  const paramsKeys = [...resourceManager.keys()]
  const paramsValues = [...resourceManager.values()]

  let newFunction, result

  try {
    newFunction = new window.Function(...paramsKeys, `
    return ${code}
  `);

    try {
      result = newFunction(...paramsValues);
    } catch (e) {
      console.error('表达式结果异常')
    }
  } catch (e) {
    console.error('表达式编译异常')
  }

  return result || '*Null*'
}