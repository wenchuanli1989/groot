import { Component, ModalStatus, useModel } from "@grootio/common";
import { Form, Input, Modal } from "antd";
import { useEffect } from "react";
import SolutionModel from "../SolutionModel";


const ComponentAddModal: React.FC = () => {
  const [form] = Form.useForm();
  const solutionModel = useModel(SolutionModel)

  useEffect(() => {
    if (solutionModel.componentAddModalStatus !== ModalStatus.None) {
      form.resetFields();
    }
  }, [solutionModel.componentAddModalStatus])

  const handleOk = async () => {
    const formData = await form.validateFields();
    solutionModel.addComponent(formData as Component)
  }

  const handleCancel = () => {
    solutionModel.componentAddModalStatus = ModalStatus.None;
  }

  return <Modal open={solutionModel.componentAddModalStatus !== ModalStatus.None} mask={false} title="创建组件"
    confirmLoading={solutionModel.componentAddModalStatus === ModalStatus.Submit}
    onOk={handleOk} onCancel={handleCancel} okText="创建">
    <Form form={form} colon={false} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} >
      <Form.Item label="名称" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="组件名称" name="componentName" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="组件包名" name="packageName" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

    </Form>
  </Modal>
}

export default ComponentAddModal;