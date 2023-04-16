import { PropBlockLayout, PropBlockStructType, useModel } from "@grootio/common";
import { Form, Input, Modal, Radio, Switch } from "antd";
import React, { useEffect, useRef } from "react";
import PropPersistModel from "../PropPersistModel";


const PropBlockSetting: React.FC = () => {
  const propPersistModel = useModel(PropPersistModel);
  const [form] = Form.useForm();
  const inputRef = useRef<any>(null);

  const handleOk = async () => {
    const blockFormData = await form.validateFields();
    propPersistModel.updateOrAddPropBlock(blockFormData);
  }

  const handleCancel = () => {
    propPersistModel.currSettingPropBlock = undefined;
  }

  useEffect(() => {
    if (propPersistModel.currSettingPropBlock) {
      form.resetFields();
      form.setFieldsValue(propPersistModel.currSettingPropBlock);

      setTimeout(() => {
        inputRef.current.focus({ cursor: 'all' });
      }, 300)
    }
  }, [propPersistModel.currSettingPropBlock]);

  return (<Modal mask={false} width={400} title={propPersistModel.currSettingPropBlock?.id ? '更新配置块' : '创建配置块'}
    confirmLoading={propPersistModel.settingModalSubmitting} open={!!propPersistModel.currSettingPropBlock}
    okText={propPersistModel.currSettingPropBlock?.id ? '更新' : '创建'} onOk={handleOk} onCancel={handleCancel}>

    <Form form={form} colon={false} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
      <Form.Item name="name" label="名称" rules={[{ required: true }]}>
        <Input ref={inputRef} />
      </Form.Item>
      <Form.Item noStyle dependencies={['struct']}>
        {
          () => {
            const struct = form.getFieldValue('struct');
            return (
              <Form.Item label="属性名" name="propKey" rules={[{ required: struct === PropBlockStructType.List }]}>
                <Input />
              </Form.Item>
            )
          }
        }
      </Form.Item>
      <Form.Item valuePropName="checked" label="根属性" name="rootPropKey">
        <Switch />
      </Form.Item>
      <Form.Item label="结构" name="struct" initialValue={PropBlockStructType.Default}>
        <Radio.Group disabled={!!propPersistModel.currSettingPropBlock?.id}>
          <Radio value={PropBlockStructType.Default}>默认</Radio>
          <Radio value={PropBlockStructType.List}>列表</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="配置项布局" name="layout" initialValue={PropBlockLayout.Horizontal}>
        <Radio.Group >
          <Radio value={PropBlockLayout.Horizontal}>水平</Radio>
          <Radio value={PropBlockLayout.Vertical}>垂直</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  </Modal>)
}

export default PropBlockSetting;