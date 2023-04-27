import { FormItemRender, PropItem, useModel } from "@grootio/common";
import PropHandleModel from "../PropHandleModel";
import { FormItemProps } from "antd";
import { useMemo } from "react";
import React from "react";

type PropsType = {
  propItem: PropItem,
  simplify: boolean,
  formItemProps: FormItemProps
}
const FormItemView: React.FC<PropsType> = ({ propItem, simplify, formItemProps }) => {
  const propHandleModel = useModel(PropHandleModel);

  // 缓存组件避免重新渲染导致组件销毁重建
  const View = useMemo(() => {
    if (propHandleModel.propFormItemObj[propItem.viewType]) {
      return propHandleModel.propFormItemObj[propItem.viewType]
    } else if (propHandleModel.propFormItemObj['*']) {
      return propHandleModel.propFormItemObj['*']
    } else {
      return (() => <>未识别的类型</>) as any as React.FC<FormItemRender>
    }
  }, [])

  return <View propItem={propItem} simplify={simplify} formItemProps={formItemProps} />
}

export default FormItemView;