import { APIPath, Component, ModalStatus, useModel } from "@grootio/common";
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
      getContext().request(APIPath.solutionComponent_list_solutionVersionId, { solutionVersionId: 1, view: 'true' }).then(({ data }) => {
        setComponentList(data.map(item => {
          item.component.componentVersionId = item.componentVersionId
          return item.component
        }));
      })
    }
  }, [applicationModel.instanceAddModalStatus]);

  const handleOk = async () => {
    const formData = await form.validateFields();
    applicationModel.addView(formData as any)
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
          return (<Form.Item label="原型" name="solutionComponentId" rules={[{ required: !empty }]}>
            <Select disabled={empty}>
              {
                componentList.map((c) => {
                  return <Select.Option key={c.componentVersionId} value={c.componentVersionId}>{c.name}</Select.Option>
                })
              }
            </Select>
          </Form.Item>)
        }}
      </Form.Item>

      <Form.Item label="主入口" name="primaryView" valuePropName="checked">
        <Switch />
      </Form.Item>

    </Form>
  </Modal>
}

export default InstanceAddModal;