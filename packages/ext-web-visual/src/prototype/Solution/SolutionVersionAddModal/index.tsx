import { ModalStatus, useModel } from "@grootio/common"
import { Form, Input, Modal, Select } from "antd"
import SolutionModel from "../SolutionModel"
import { useEffect } from "react"
import { getContext } from "context"

const SolutionVersionAddModal = () => {
  const solutionModel = useModel(SolutionModel)
  const [form] = Form.useForm();

  useEffect(() => {
    if (solutionModel.solutionVersionAddModalStatus !== ModalStatus.None) {
      form.resetFields();
      form.setFieldValue('imageVersionId', +getContext().params.solutionVersionId)
    }
  }, [solutionModel.solutionVersionAddModalStatus])


  const handleOk = async () => {
    const { imageVersionId, name } = await form.validateFields();
    solutionModel.addSolutionVersion(imageVersionId, name)
  }

  const handleCancel = () => {
    solutionModel.solutionVersionAddModalStatus = ModalStatus.None
  }

  return <Modal open={solutionModel.solutionVersionAddModalStatus !== ModalStatus.None} mask={false} title="创建版本"
    confirmLoading={solutionModel.solutionVersionAddModalStatus === ModalStatus.Submit} onOk={handleOk} onCancel={handleCancel} okText="创建">

    <Form form={form} colon={false} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
      <Form.Item label="名称" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="关联版本" name="imageVersionId" rules={[{ required: true }]} >
        <Select fieldNames={{ label: 'name', value: 'id' }}
          options={solutionModel.solutionVersionList}
        />
      </Form.Item>
    </Form>
  </Modal>
}

export default SolutionVersionAddModal