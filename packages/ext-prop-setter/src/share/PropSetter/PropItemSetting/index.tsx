import { Form, Input, Modal, Radio, Select, Space, Switch, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { PropItem, PropItemViewType, useModel } from "@grootio/common";
import PropPersistModel from "../PropPersistModel";
import { propKeyRule } from "util/index";
import { grootManager } from "context";


const PropItemSetting: React.FC = () => {
  const propPersistModel = useModel(PropPersistModel);

  const [form] = Form.useForm<PropItem>();
  const [propTypeOptions] = useState(() => {
    const viewTypeMap = grootManager.state.getState('gs.propItem.viewTypeMap')
    const result = [...viewTypeMap.keys()].map((value) => ({ label: viewTypeMap.get(value).label, value }))
    return result
  })

  const handleOk = async () => {
    const itemFormData = await form.validateFields();
    propPersistModel.updateOrAddPropItem(itemFormData);
  }

  const handleCancel = () => {
    propPersistModel.currSettingPropItem = undefined;
  }

  useEffect(() => {
    if (propPersistModel.currSettingPropItem) {
      form.resetFields();
      form.setFieldsValue(propPersistModel.currSettingPropItem);
    }
  }, [propPersistModel.currSettingPropItem]);

  const renderSelectFormItem = () => {
    return (
      <Form.Item label="选项" >
        <Form.List name="optionList" initialValue={[{}]} >
          {(fields, { add, remove }) => {
            return <>
              {fields.map(({ key, name, ...restField }, index) => {
                return <Space key={key} align="baseline">
                  <Form.Item name={[name, 'label']} {...restField} rules={[{ required: true }]}>
                    <Input placeholder="请输入名称" />
                  </Form.Item>
                  <Form.Item name={[name, 'value']} {...restField} rules={[{ required: true }]}>
                    <Input placeholder="请输入数据" />
                  </Form.Item>

                  <Form.Item noStyle dependencies={['type']}>
                    {() => {
                      const type = form.getFieldValue('type');
                      return type === PropItemViewType.ButtonGroup ? <Form.Item name={[name, 'title']} {...restField} >
                        <Input placeholder="请输入描述" />
                      </Form.Item> : null;
                    }}
                  </Form.Item>

                  <Form.Item noStyle dependencies={['viewType']}>
                    {() => {
                      const viewType = form.getFieldValue('viewType');
                      return viewType === PropItemViewType.ButtonGroup ? <Form.Item name={[name, 'icon']} {...restField} >
                        <Input placeholder="请输入图标" />
                      </Form.Item> : null;
                    }}
                  </Form.Item>

                  <Typography.Link onClick={() => add({ label: '', value: '' }, index + 1)}>
                    <PlusOutlined />
                  </Typography.Link>
                  <Typography.Link disabled={fields.length === 1} onClick={() => remove(name)}>
                    <DeleteOutlined />
                  </Typography.Link>
                </Space>
              })}
            </>
          }}
        </Form.List>
      </Form.Item>
    )
  }

  return (<Modal mask={false} destroyOnClose width={600} title={propPersistModel.currSettingPropItem?.id ? '更新配置项' : '创建配置项'}
    confirmLoading={propPersistModel.settingModalSubmitting} open={!!propPersistModel.currSettingPropItem}
    onOk={handleOk} onCancel={handleCancel} okText={propPersistModel.currSettingPropItem?.id ? '更新' : '创建'}>

    <Form form={form} colon={false} labelAlign="right" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} >
      <Form.Item name="label" label="名称" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="类型" name="viewType" rules={[{ required: true }]} initialValue="text">
        <Select options={propTypeOptions} />
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


      <Form.Item dependencies={['viewType']} noStyle >
        {({ getFieldValue }) => {
          const viewType = getFieldValue('viewType');
          const hasOption = ([PropItemViewType.Select, PropItemViewType.Radio, PropItemViewType.Checkbox, PropItemViewType.ButtonGroup] as string[]).includes(viewType);

          return hasOption ? renderSelectFormItem() : null
        }}
      </Form.Item>
    </Form>
  </Modal>)
}

export default PropItemSetting;