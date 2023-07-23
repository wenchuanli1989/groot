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

    grootManager.state.watchState('gs.viewList', (newValue) => {
      this.syncViewList(newValue)
    })

    this.syncViewList(grootManager.state.getState('gs.viewList'))
  }

  private syncViewList(newList) {
    this.primaryViewList = []
    this.noPrimaryViewList = []

    newList.forEach(item => {
      if (item.primaryView) {
        this.primaryViewList.push(item)
      } else {
        this.noPrimaryViewList.push(item)
      }
    })
  }

  public addView(view: View) {
    this.instanceAddModalStatus = ModalStatus.Submit;

    return getContext().request(APIPath.view_add, {
      key: view.key,
      name: view.name,
      appId: view.appId,
      solutionComponentId: view.solutionComponentId
    }).then(({ data }) => {
      grootManager.state.getState('gs.viewList').push(data)

      grootManager.command.executeCommand('gc.openView', data.id)
    }).finally(() => {
      this.instanceAddModalStatus = ModalStatus.None;
    })
  }


  public addRelease(rawRelease: Release) {
    this.releaseAddModalStatus = ModalStatus.Submit;
    return getContext().request(APIPath.release_add, rawRelease).then(({ data }) => {
      // this.releaseList.push(data);
      return this.switchRelease(data.id);
    }).finally(() => {
      this.releaseAddModalStatus = ModalStatus.None;
    })
  }


  public switchRelease(releaseId: number) {
    // const release = this.releaseList.find(item => item.id === releaseId)
    // grootManager.state.setState('gs.release', release)
    grootManager.command.executeCommand('gc.navRelease', releaseId)
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