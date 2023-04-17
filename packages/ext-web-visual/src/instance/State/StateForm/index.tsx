import { Button, Form, Input, Select, Space } from "antd";
import { useEffect } from "react";

import { StateCategory, useModel } from "@grootio/common";
import StateModel from "../StateModel";
import { grootManager } from "context";

const StateForm: React.FC = () => {
  const stateModel = useModel(StateModel);

  const [form] = Form.useForm();

  useEffect(() => {
    if (stateModel.currState) {
      form.setFieldsValue({
        ...(stateModel.currState ? stateModel.currState : {}),
        releaseId: grootManager.state.getState('gs.release').id
      });
    } else {
      form.resetFields();
    }

    if (!stateModel.isGlobalState) {
      form.setFieldValue('instanceId', grootManager.state.getState('gs.componentInstance').id);
    }
  }, [stateModel.formVisible]);

  const onSubmit = async () => {
    const stateData = await form.validateFields();

    if (stateModel.currState) {
      stateModel.updateState(stateData);
    } else {
      stateModel.addState(stateData);
    }
  }

  return <>

    <Form layout="vertical" form={form} colon={false} disabled={stateModel.currState?.isReadonly}>
      <Form.Item label="名称" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="内容" name="value" >
        <Input />
      </Form.Item>

      <Form.Item label="类型" name="type" initialValue={StateCategory.Str}>
        <Select options={StateTypeMap} />
      </Form.Item>
    </Form>

    <div style={{ display: 'flex' }}>
      <div style={{ flexGrow: 1 }}>
        <Button danger disabled={stateModel.currState?.isReadonly} onClick={() => stateModel.removeState()}>删除</Button>
      </div>
      <Space>
        <Button onClick={() => stateModel.hideForm()}>取消</Button>
        <Button type="primary" disabled={stateModel.currState?.isReadonly} onClick={() => onSubmit()}>提交</Button>
      </Space>
    </div>
  </>
}

const StateTypeMap = [
  { label: '字符串', value: StateCategory.Str },
  { label: '布尔', value: StateCategory.Bool },
  { label: '数字', value: StateCategory.Num },
  { label: '对象', value: StateCategory.Obj },
  { label: '数组', value: StateCategory.Arr },
]


export default StateForm;