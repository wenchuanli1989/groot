import { ModalStatus, Release, useModel } from "@grootio/common";
import { Form, Input, Modal, Select } from "antd";
import { useEffect } from "react";
import ApplicationModel from "../ApplicationModel";


const ReleaseAddModal: React.FC = () => {
  const [form] = Form.useForm();
  const applicationModel = useModel(ApplicationModel);

  useEffect(() => {
    if (applicationModel.releaseAddModalStatus === ModalStatus.Init) {
      form.resetFields();
    }
  }, [applicationModel.instanceAddModalStatus]);

  const handleOk = async () => {
    const formData = await form.validateFields();
    applicationModel.addRelease(formData as Release)
  }

  const handleCancel = () => {
    applicationModel.releaseAddModalStatus = ModalStatus.None;
  }

  const changeImageRelease = (releaseId: number) => {
    const release = applicationModel.releaseList.find(item => item.id === releaseId)
    form.setFieldsValue({
      debugBaseUrl: release.debugBaseUrl,
      playgroundPath: release.playgroundPath
    })
  }

  return <Modal open={applicationModel.releaseAddModalStatus !== ModalStatus.None} mask={false} title="新增迭代"
    confirmLoading={applicationModel.releaseAddModalStatus === ModalStatus.Submit}
    onOk={handleOk} onCancel={handleCancel} okText="新增">
    <Form form={form} colon={false} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
      <Form.Item label="名称" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="克隆" name="imageReleaseId" >
        <Select onChange={(e) => {
          changeImageRelease(e)
        }}>
          {
            applicationModel.releaseList.map((release) => {
              return <Select.Option key={release.id} value={release.id}>{release.name}</Select.Option>
            })
          }
        </Select>
      </Form.Item>

      <Form.Item label="页面地址" name="debugBaseUrl">
        <Input />
      </Form.Item>

      <Form.Item label="调试地址" name="playgroundPath">
        <Input />
      </Form.Item>
    </Form>
  </Modal>
}

export default ReleaseAddModal;