import { Form, Input, Modal, Radio, Switch } from "antd";
import React, { ReactElement, useEffect, useMemo, useState } from "react";
import { PropItemSettingRenderProps, PropItem, useModel } from "@grootio/common";
import PropPersistModel from "../PropPersistModel";
import { propKeyRule } from "util/index";
import { grootManager } from "context";

import styles from './index.module.less'


const PropItemSetting: React.FC = () => {
  const propPersistModel = useModel(PropPersistModel);

  const defaultSettingRender = () => {
    return (<>
      <Form.Item name="label" label="名称" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="属性名" rules={[{ required: true }, { pattern: propKeyRule, message: '格式错误，必须是标准js标识符' }]} name="propKey">
        <Input />
      </Form.Item>
      <Form.Item valuePropName="checked" label="根属性" name="rootPropKey">
        <Switch />
      </Form.Item>

      {
        propPersistModel.currSettingPropItem?.span !== -1 && (
          <Form.Item label="宽度" name="span">
            <Radio.Group >
              <Radio value={12}>半行</Radio>
              <Radio value={24}>整行</Radio>
            </Radio.Group>
          </Form.Item>)
      }

    </>)
  }

  if (!propPersistModel.currSettingPropItem) return null

  if (!propPersistModel.currSettingPropItem.id) {
    return <CreatePropItemSetting defaultSettingRender={defaultSettingRender()} />
  } else {
    return <UpdatePropItemSetting defaultSettingRender={defaultSettingRender()} />
  }
}

const CreatePropItemSetting: React.FC<{ defaultSettingRender: ReactElement }> = ({ defaultSettingRender }) => {
  const [form] = Form.useForm<PropItem>();
  const propPersistModel = useModel(PropPersistModel);
  const [viewTypeMap] = grootManager.state.useStateByName('gs.propItem.type')
  const [selectType, setSelectType] = useState<string>()
  const [SettingRender, setSettingRender] = useState<React.FC<PropItemSettingRenderProps>>()
  const [showSelectType, setShowSelectType] = useState(true)

  const handleOk = async () => {
    if (!showSelectType) {
      const rawFormData = await form.validateFields();
      propPersistModel.updateOrAddPropItem(rawFormData);
    } else {
      propPersistModel.currSettingPropItem.viewType = selectType
      setShowSelectType(false)
      form.setFieldsValue(propPersistModel.currSettingPropItem)
      if (propPersistModel.currSettingPropItem.extraData) {
        form.setFieldsValue(propPersistModel.currSettingPropItem.extraData)
      }
    }
  }

  const handleCancel = () => {
    propPersistModel.currSettingPropItem = undefined;
  }

  const cancelBtnClick = () => {
    if (showSelectType) {
      propPersistModel.currSettingPropItem = undefined;
    } else {
      setShowSelectType(true)
    }
  }

  const createProps = () => {
    const props = {
      title: '',
      okText: '',
      cancelText: '',
      confirmLoading: propPersistModel.settingModalSubmitting,
      children: null
    }

    if (showSelectType) {
      props.title = '选择类型'
      props.okText = '下一步'
      props.cancelText = '取消'

      props.children = (<div className={styles.viewTypeContainer}>
        {[...viewTypeMap.keys()].filter(key => key !== '*').map(viewTypeKey => {
          const item = viewTypeMap.get(viewTypeKey)

          return <div className={`${styles.viewType} ${selectType === viewTypeKey ? styles.viewTypeActive : ''}`} key={viewTypeKey} onClick={() => {
            setSelectType(viewTypeKey)
            setSettingRender(() => {
              if (item.settingRender) {
                return item.settingRender
              } else {
                return () => <Form form={form} colon={false} labelAlign="right" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>{defaultSettingRender}</Form>
              }
            })
          }}>{item.label}</div>
        })}
      </div>)
    } else {
      props.title = '创建配置项'
      props.okText = '创建'
      props.cancelText = '上一步'
      props.children = <SettingRender propItem={propPersistModel.currSettingPropItem} form={form} simplify={false} defaultRender={defaultSettingRender} type='create' />
    }

    return props;
  }

  const modalProps = createProps()

  return (<Modal mask={false} destroyOnClose width={600} title={modalProps.title}
    confirmLoading={modalProps.confirmLoading} cancelText={modalProps.cancelText} open
    onOk={handleOk} onCancel={handleCancel} okText={modalProps.okText} cancelButtonProps={{ onClick: cancelBtnClick }} >
    {modalProps.children}
  </Modal>)
}

const UpdatePropItemSetting: React.FC<{ defaultSettingRender: ReactElement }> = ({ defaultSettingRender }) => {
  const [form] = Form.useForm<PropItem>();
  const propPersistModel = useModel(PropPersistModel);
  const settingRender = useMemo<ReactElement>(() => {
    const viewTypeMap = grootManager.state.getState('gs.propItem.type')
    const viewType = propPersistModel.currSettingPropItem.viewType
    const SettingRender = viewTypeMap.get(viewType)?.settingRender || viewTypeMap.get('*')?.settingRender

    if (!SettingRender) {
      return <Form form={form} colon={false} labelAlign="right" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>{defaultSettingRender}</Form>
    }

    return <SettingRender defaultRender={defaultSettingRender} type="update" form={form} propItem={propPersistModel.currSettingPropItem} simplify={false} />
  }, [])

  useEffect(() => {
    form.setFieldsValue(propPersistModel.currSettingPropItem)
    if (propPersistModel.currSettingPropItem.extraData) {
      form.setFieldsValue(propPersistModel.currSettingPropItem.extraData)
    }
  }, [])

  const handleOk = async () => {
    const rawFormData = await form.validateFields();
    propPersistModel.updateOrAddPropItem(rawFormData);
  }

  const handleCancel = () => {
    propPersistModel.currSettingPropItem = undefined;
  }

  return (<Modal mask={false} destroyOnClose width={600} title="更新配置项"
    confirmLoading={propPersistModel.settingModalSubmitting} open
    onOk={handleOk} onCancel={handleCancel} okText="更新" >
    {settingRender}
  </Modal>)
}

export default PropItemSetting;