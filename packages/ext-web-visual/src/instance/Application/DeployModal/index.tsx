import { Form, Modal, Radio } from "antd";
import { EnvType, ModalStatus, useModel } from "@grootio/common";
import { useEffect } from "react";

import ApplicationModel from "../ApplicationModel";

const DeployModal: React.FC = () => {
  const applicationModel = useModel(ApplicationModel)
  const [form] = Form.useForm();

  useEffect(() => {
    if (applicationModel.assetDeployModalStatus === ModalStatus.Init) {
      form.resetFields();
    }
  }, [applicationModel.assetDeployModalStatus])

  const onOk = async () => {
    const formData = await form.validateFields();
    applicationModel.createDeploy(formData);
  }

  return <Modal open={applicationModel.assetDeployModalStatus !== ModalStatus.None} title="部署"
    confirmLoading={applicationModel.assetDeployModalStatus === ModalStatus.Submit} onOk={onOk}>
    <Form form={form} layout="horizontal" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
      <Form.Item label="环境" name="env" initialValue={EnvType.Dev}>
        <Radio.Group>
          <Radio.Button value={EnvType.Dev}>dev</Radio.Button>
          <Radio.Button value={EnvType.Qa}>qa</Radio.Button>
          <Radio.Button value={EnvType.Pl}>pl</Radio.Button>
          <Radio.Button value={EnvType.Ol}>online</Radio.Button>
        </Radio.Group>
      </Form.Item>
    </Form>
  </Modal>
}

export default DeployModal;