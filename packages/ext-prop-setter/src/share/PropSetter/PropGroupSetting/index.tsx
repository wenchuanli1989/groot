import { Form, Input, Modal, Radio } from "antd";
import React, { useEffect, useRef } from "react";

import { PropGroupStructType, useModel } from "@grootio/common";
import PropPersistModel from "../PropPersistModel";

const PropGroupSetting: React.FC = () => {
  const propPersistModel = useModel(PropPersistModel);
  const [form] = Form.useForm();
  const inputRef = useRef<any>(null);

  const handleOk = async () => {
    const groupFormData = await form.validateFields();
    propPersistModel.updateOrAddPropGroup(groupFormData);
  }

  const handleCancel = () => {
    propPersistModel.currSettingPropGroup = undefined;
  }

  useEffect(() => {
    if (propPersistModel.currSettingPropGroup) {
      form.resetFields();
      form.setFieldsValue(propPersistModel.currSettingPropGroup);

      setTimeout(() => {
        inputRef.current.focus({ cursor: 'all' });
      }, 300)
    }
  }, [propPersistModel.currSettingPropGroup]);

  return (<Modal mask={false} width={400} title={propPersistModel.currSettingPropGroup?.id ? '更新配置组' : '创建配置组'}
    confirmLoading={propPersistModel.settingModalSubmitting} okText={propPersistModel.currSettingPropGroup?.id ? '更新' : '创建'}
    open={!!propPersistModel.currSettingPropGroup} onOk={handleOk} onCancel={handleCancel}>

    <Form form={form} colon={false} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
      <Form.Item name="name" label="名称" rules={[{ required: true }]}>
        <Input ref={inputRef} />
      </Form.Item>
      <Form.Item name="struct" label="结构" rules={[{ required: true }]} initialValue={PropGroupStructType.Default}>
        <Radio.Group disabled={!!propPersistModel.currSettingPropGroup?.id}>
          <Radio value={PropGroupStructType.Default}>层级</Radio>
          <Radio value={PropGroupStructType.Flat}>平铺</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="属性名" name="propKey" >
        <Input />
      </Form.Item>

    </Form>
  </Modal>)
}


export default PropGroupSetting;