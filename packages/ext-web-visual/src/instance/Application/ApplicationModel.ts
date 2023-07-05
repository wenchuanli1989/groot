import { APIPath, BaseModel, Deploy, DeployStatusType, ModalStatus, Release, View } from "@grootio/common";
import { message } from "antd";
import { getContext, grootManager, } from "context";

export default class ApplicationModel extends BaseModel {
  static modelName = 'ApplicationModel';

  instanceAddModalStatus: ModalStatus = ModalStatus.None
  releaseAddModalStatus: ModalStatus = ModalStatus.None
  assetBuildModalStatus: ModalStatus = ModalStatus.None
  assetDeployModalStatus: ModalStatus = ModalStatus.None
  assetBuildStatus: 'init' | 'analyseOver' | 'building' | 'buildOver' | 'approve' = 'init';
  primaryViewList: View[] = [];
  noPrimaryViewList: View[] = [];
  releaseList: Release[] = [];
  deployBundleId: number

  public init() {
    const appId = grootManager.state.getState('gs.app').id
    getContext().request(APIPath.application_releaseList_appId, { appId }).then(({ data }) => {
      this.releaseList = data;
    })

    const viewList = grootManager.state.getState('gs.viewList')
    viewList.forEach(item => {
      if (item.primaryView) {
        this.primaryViewList.push(item)
      } else {
        this.noPrimaryViewList.push(item)
      }
    })
  }

  public addView(view: View) {
    this.instanceAddModalStatus = ModalStatus.Submit;
    view.releaseId = grootManager.state.getState('gs.release').id
    return getContext().request(APIPath.view_add, view).then(({ data }) => {
      if (view.primaryView) {
        this.primaryViewList.push(data)
      } else {
        this.noPrimaryViewList.push(data)
      }

      const { executeCommand } = grootManager.command
      executeCommand('gc.loadView', data.id).then((viewParams) => {
        const view = grootManager.state.getState('gs.viewList').find(item => item.id === data.id)
        executeCommand('gc.stageRefresh', view.key, viewParams)
        executeCommand('gc.switchIstance', data.id, data.id)
      })
    }).finally(() => {
      this.instanceAddModalStatus = ModalStatus.None;
    })
  }


  public addRelease(rawRelease: Release) {
    this.releaseAddModalStatus = ModalStatus.Submit;
    return getContext().request(APIPath.release_add, rawRelease).then(({ data }) => {
      this.releaseList.push(data);
      return this.switchRelease(data.id);
    }).finally(() => {
      this.releaseAddModalStatus = ModalStatus.None;
    })
  }


  public switchRelease(releaseId: number) {
    const release = this.releaseList.find(item => item.id === releaseId)
    grootManager.state.setState('gs.release', release)

    // if (trackId) {
    //   getContext().request(APIPath.componentInstance_reverseDetectId, { releaseId, trackId }).then(({ data: releaseId }) => {
    //     if (releaseId) {

    //       // grootManager.command.executeCommand('gc.fetch.release', { releaseId })
    //     } else {
    //       const firstInstance = this.primaryViewList[0]
    //       // grootManager.command.executeCommand('gc.fetch.release', { relatedEntryId: firstInstance.id })
    //     }
    //   })
    // } else {
    const firstInstance = this.noPrimaryViewList[0]
    // grootManager.command.executeCommand('gc.fetch.release', { relatedEntryId: firstInstance.id })
    // }
  }


  public assetBuild() {
    this.assetBuildStatus = 'building';
    const releaseId = grootManager.state.getState('gs.release').id
    getContext().request(APIPath.asset_build, { releaseId }).then(({ data }) => {
      this.assetBuildStatus = 'buildOver';
      this.deployBundleId = data;
    })
  }

  public createDeploy(formData: Deploy) {
    this.assetDeployModalStatus = ModalStatus.Submit;
    getContext().request(APIPath.asset_createDeploy, { bundleId: this.deployBundleId, ...formData }).then(({ data: deploy }) => {
      if (deploy.status === DeployStatusType.Approval) {
        this.assetDeployModalStatus = ModalStatus.None;
        message.success('流程审批中')
      } else if (deploy.status === DeployStatusType.Ready) {
        getContext().request(APIPath.asset_publish, { deployId: deploy.id }).then(() => {
          message.success('发布成功')
          this.assetDeployModalStatus = ModalStatus.None;
        })
      }
    })
  }
}