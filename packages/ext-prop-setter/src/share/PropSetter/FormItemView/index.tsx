import { PropItem } from "@grootio/common";
import { FormItemProps } from "antd";
import { useMemo } from "react";
import React from "react";
import { grootManager } from "context";

type PropsType = {
  propItem: PropItem,
  simplify: boolean,
  formItemProps: FormItemProps
}
const FormItemView: React.FC<PropsType> = ({ propItem, simplify, formItemProps }) => {

  // 缓存组件避免重新渲染导致组件销毁重建
  const View = useMemo(() => {
    const propItemTypeMap = grootManager.state.getState('gs.propItem.type')
    const render = propItemTypeMap.get(propItem.viewType)?.viewRender
    const notSupport = propItemTypeMap.get('*').viewRender

    return render || notSupport || (() => <>未识别的类型</>)
  }, [])

  return <View propItem={propItem} simplify={simplify} formItemProps={formItemProps} />
}

export default FormItemView;