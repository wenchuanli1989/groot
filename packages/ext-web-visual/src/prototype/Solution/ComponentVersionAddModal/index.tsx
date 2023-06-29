import { ComponentVersion, ModalStatus, SolutionComponent, useModel } from "@grootio/common";
import { Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import SolutionModel from "../SolutionModel";


const ComponentVersionAddModal: React.FC = () => {
  const [form] = Form.useForm();
  const solutionModel = useModel(SolutionModel)
  const [currSolutionComponent, setCurrSolutionComponent] = useState<SolutionComponent>()

  useEffect(() => {
    if (solutionModel.componentVersionAddModalStatus !== ModalStatus.None) {
      const solutionComponent = solutionModel.solutionComponentList.find(item => item.id === solutionModel.activeSolutionComponentId)
      form.resetFields();
      form.setFieldValue('imageVersionId', solutionComponent.currVersionId)
      setCurrSolutionComponent(solutionComponent)
    }
  }, [solutionModel.componentVersionAddModalStatus])

  const handleOk = async () => {
    const formData = await form.validateFields();
    solutionModel.addComponentVersion(formData as ComponentVersion)
  }

  const handleCancel = () => {
    solutionModel.componentVersionAddModalStatus = ModalStatus.None;
  }

  return <Modal open={solutionModel.componentVersionAddModalStatus !== ModalStatus.None} mask={false} title="创建版本"
    confirmLoading={solutionModel.componentVersionAddModalStatus === ModalStatus.Submit}
    onOk={handleOk} onCancel={handleCancel} okText="创建">
    <Form form={form} colon={false} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
      <Form.Item label="名称" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="关联版本" name="imageVersionId" rules={[{ required: true }]} >
        <Select options={currSolutionComponent?.component?.versionList.map((item) => {
          return { label: item.name, value: item.id }
        })} />
      </Form.Item>
    </Form>
  </Modal>
}

export default ComponentVersionAddModal;