import { Button, Form, Input, Select, Space } from "antd";
import { useEffect } from "react";

import { useModel } from "@grootio/common";
import ResourceModel from "../ResourceModel";
import { grootManager } from "context";

const ResourceForm: React.FC = () => {
  const resourceModel = useModel(ResourceModel);

  const [form] = Form.useForm();

  useEffect(() => {
    if (resourceModel.currResource) {
      form.setFieldsValue({
        ...(resourceModel.currResource ? resourceModel.currResource : {}),
        releaseId: grootManager.state.getState('gs.release').id
      });
    } else {
      form.resetFields();
    }

    if (!resourceModel.isGlobalResource) {
      form.setFieldValue('instanceId', grootManager.state.getState('gs.componentInstance').id);
    }
  }, [resourceModel.formVisible]);

  const onSubmit = async () => {
    const resourceData = await form.validateFields();

    if (resourceModel.currResource) {
      resourceModel.updateResource(resourceData);
    } else {
      resourceModel.addResource(resourceData);
    }
  }

  return <>

    <Form layout="vertical" form={form} colon={false} disabled={resourceModel.currResource?.isReadonly}>
      <Form.Item label="名称" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="内容" name="value" >
        <Input />
      </Form.Item>

      <Form.Item label="类型" name="type" initialValue="String">
        <Select options={ResourceTypeMap} />
      </Form.Item>
    </Form>

    <div style={{ display: 'flex' }}>
      <div style={{ flexGrow: 1 }}>
        <Button danger disabled={resourceModel.currResource?.isReadonly} onClick={() => resourceModel.removeResource()}>删除</Button>
      </div>
      <Space>
        <Button onClick={() => resourceModel.hideForm()}>取消</Button>
        <Button type="primary" disabled={resourceModel.currResource?.isReadonly} onClick={() => onSubmit()}>提交</Button>
      </Space>
    </div>
  </>
}

const ResourceTypeMap = [
  { label: '字符串', value: 'String' },
  { label: '布尔', value: 'Boolean' },
  { label: '数字', value: 'Number' },
  { label: '对象', value: 'Object' },
  { label: '数组', value: 'Array' },
]


export default ResourceForm;