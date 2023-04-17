import { Button, Modal } from "antd";

import { ModalStatus, useModel } from "@grootio/common";
import ApplicationModel from "../ApplicationModel";

const BuildModal: React.FC = () => {
  const applicationModel = useModel(ApplicationModel)

  const onCancel = () => {
    applicationModel.assetBuildModalStatus = ModalStatus.None
  }

  let actions = [
    <Button key="primary" onClick={() => applicationModel.assetBuild()} type="primary" loading={applicationModel.assetBuildStatus === 'building'}>构建</Button>,
    <Button key="cancel" onClick={onCancel}>取消</Button>,
  ]

  if (applicationModel.assetBuildStatus === 'approve') {
    actions = [
      <Button key="primary" type="primary">查看审批</Button>,
      <Button key="cancel" onClick={onCancel}>取消</Button>,
    ]
  } else if (applicationModel.assetBuildStatus === 'buildOver') {
    actions = [
      <Button key="primary" onClick={() => {
        applicationModel.assetBuildModalStatus = ModalStatus.None;
        applicationModel.assetDeployModalStatus = ModalStatus.Init;
        applicationModel.assetBuildStatus = 'init';
      }} type="primary">前往部署</Button>,
      <Button key="cancel" onClick={onCancel}>取消</Button>,
    ]
  }

  return <Modal open={applicationModel.assetBuildModalStatus !== ModalStatus.None} onCancel={onCancel} title="构建" footer={[actions]}>
    {
      applicationModel.assetBuildStatus === 'init' && (
        <div>
          分析中...
        </div>
      )
    }

    {
      applicationModel.assetBuildStatus === 'analyseOver' && (
        <div>分析结果：</div>
      )
    }

    {
      applicationModel.assetBuildStatus === 'building' && (
        <div>
          构建中...
        </div>
      )
    }

    {
      applicationModel.assetBuildStatus === 'buildOver' && (
        <div>
          构建完成
        </div>
      )
    }

    {
      applicationModel.assetBuildStatus === 'approve' && (
        <div>
          构建完成，需要审批
        </div>
      )
    }
  </Modal>
}

export default BuildModal;