import { APIPath, Component, ComponentInstance, ModalStatus, useModel } from "@grootio/common";
import { Form, Input, Modal, Select, Switch } from "antd";
import { getContext } from "context";
import { useEffect, useState } from "react";
import ApplicationModel from "../ApplicationModel";


const InstanceAddModal: React.FC = () => {
  const applicationModel = useModel(ApplicationModel);
  const [form] = Form.useForm();
  const [componentList, setComponentList] = useState<Component[]>([]);

  useEffect(() => {
    if (applicationModel.instanceAddModalStatus === ModalStatus.Init) {
      form.resetFields();
      getContext().request(APIPath.solution_componentList_solutionVersionId, { solutionVersionId: 1, all: false }).then(({ data }) => {
        setComponentList(data);
      })
    }
  }, [applicationModel.instanceAddModalStatus]);

  const handleOk = async () => {
    const formData = await form.validateFields();
    applicationModel.addEntry(formData as ComponentInstance)
  }

  const handleCancel = () => {
    applicationModel.instanceAddModalStatus = ModalStatus.None;
  }

  return <Modal open={applicationModel.instanceAddModalStatus !== ModalStatus.None} mask={false} title="新增实例"
    confirmLoading={applicationModel.instanceAddModalStatus === ModalStatus.Submit}
    onOk={handleOk} onCancel={handleCancel} okText="新增">
    <Form form={form} colon={false} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
      <Form.Item label="名称" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="英文名称" name="key" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item noStyle dependencies={['empty']}>
        {() => {
          const empty = form.getFieldValue('empty');
          return (<Form.Item label="原型" name="componentVersionId" rules={[{ required: !empty }]}>
            <Select disabled={empty}>
              {
                componentList.map((c) => {
                  return <Select.Option key={c.activeVersionId} value={c.activeVersionId}>{c.name}</Select.Option>
                })
              }
            </Select>
          </Form.Item>)
        }}
      </Form.Item>

      <Form.Item label="主入口" name="mainEntry">
        <Switch />
      </Form.Item>

      <Form.Item label="空实例" name="empty" valuePropName="checked">
        <Switch onChange={(event) => {
          if (event) {
            form.setFieldsValue({ componentId: null });
          }
        }} />
      </Form.Item>
    </Form>
  </Modal>
}

export default InstanceAddModal;