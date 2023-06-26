import { APIPath, BaseModel, ComponentInstance, Deploy, DeployStatusType, ModalStatus, Release } from "@grootio/common";
import { message } from "antd";
import { getContext, grootManager, } from "context";

export default class ApplicationModel extends BaseModel {
  static modelName = 'ApplicationModel';

  instanceAddModalStatus: ModalStatus = ModalStatus.None
  releaseAddModalStatus: ModalStatus = ModalStatus.None
  assetBuildModalStatus: ModalStatus = ModalStatus.None
  assetDeployModalStatus: ModalStatus = ModalStatus.None
  assetBuildStatus: 'init' | 'analyseOver' | 'building' | 'buildOver' | 'approve' = 'init';
  mainEntryInstanceList: ComponentInstance[] = [];
  entryInstanceList: ComponentInstance[] = [];
  releaseList: Release[] = [];
  deployBundleId: number

  public init() {
    const appId = grootManager.state.getState('gs.app').id
    getContext().request(APIPath.application_releaseList_appId, { appId }).then(({ data }) => {
      this.releaseList = data;
    })

    const entryList = grootManager.state.getState('gs.entryList')
    entryList.forEach(item => {
      if (item.mainEntry) {
        this.mainEntryInstanceList.push(item)
      } else {
        this.entryInstanceList.push(item)
      }
    })
  }

  public addEntry(rawComponentInstance: ComponentInstance) {
    this.instanceAddModalStatus = ModalStatus.Submit;
    if (rawComponentInstance.mainEntry) {
      rawComponentInstance.wrapper = 'groot/PageContainer';
    } else {
      rawComponentInstance.wrapper = 'groot/Container';
    }

    const releaseId = grootManager.state.getState('gs.release').id
    return getContext().request(APIPath.componentInstance_addEntry, {
      ...rawComponentInstance,
      releaseId
    }).then(({ data }) => {
      if (rawComponentInstance.mainEntry) {
        this.mainEntryInstanceList.push(data)
      } else {
        this.entryInstanceList.push(data)
      }

      const { executeCommand } = grootManager.command
      executeCommand('gc.loadEntry', data.id).then((viewParams) => {
        const entry = grootManager.state.getState('gs.entryList').find(item => item.id === data.id)
        executeCommand('gc.stageRefresh', entry.key, viewParams)
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

      const currInstance = grootManager.state.getState('gs.activeComponentInstance')
      const rootInstanceId = currInstance.rootId || currInstance.id

      return this.switchRelease(data.id, rootInstanceId);
    }).finally(() => {
      this.releaseAddModalStatus = ModalStatus.None;
    })
  }


  public switchRelease(releaseId: number, trackId?: number) {
    const release = this.releaseList.find(item => item.id === releaseId)
    grootManager.state.setState('gs.release', release)

    if (trackId) {
      getContext().request(APIPath.componentInstance_reverseDetectId, { releaseId, trackId }).then(({ data: releaseId }) => {
        if (releaseId) {

          // grootManager.command.executeCommand('gc.fetch.release', { releaseId })
        } else {
          const firstInstance = this.mainEntryInstanceList[0]
          // grootManager.command.executeCommand('gc.fetch.release', { relatedEntryId: firstInstance.id })
        }
      })
    } else {
      const firstInstance = this.entryInstanceList[0]
      // grootManager.command.executeCommand('gc.fetch.release', { relatedEntryId: firstInstance.id })
    }
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