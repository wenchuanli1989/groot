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
  entryInstanceList: ComponentInstance[] = [];
  noEntryInstanceList: ComponentInstance[] = [];
  releaseList: Release[] = [];
  deployBundleId: number

  instanceAddEntry = true

  public loadReleaseList() {
    const applicationId = getContext().params.application.id
    getContext().request(APIPath.application_releaseList_applicationId, { applicationId }).then(({ data }) => {
      this.releaseList = data;
    })
  }

  public loadList(releaseId: number) {
    return getContext().request(APIPath.release_instanceList_releaseId, { releaseId }).then(({ data }) => {
      this.entryInstanceList.length = 0;
      this.noEntryInstanceList.length = 0

      data.forEach((item) => {
        if (item.entry) {
          this.entryInstanceList.push(item)
        } else {
          this.noEntryInstanceList.push(item);
        }
      })
    })
  }

  public addRootInstance(rawComponentInstance: ComponentInstance) {
    this.instanceAddModalStatus = ModalStatus.Submit;
    if (this.instanceAddEntry) {
      rawComponentInstance.wrapper = 'groot/PageContainer';
    } else {
      rawComponentInstance.wrapper = 'groot/Container';
    }

    const releaseId = grootManager.state.getState('gs.release').id
    return getContext().request(APIPath.componentInstance_addRoot, {
      ...rawComponentInstance,
      entry: this.instanceAddEntry,
      releaseId
    }).then(({ data }) => {
      if (this.instanceAddEntry) {
        this.entryInstanceList.push(data)
      } else {
        this.noEntryInstanceList.push(data)
      }

      grootManager.command.executeCommand('gc.fetch.instance', data.id)
    }).finally(() => {
      this.instanceAddModalStatus = ModalStatus.None;
    })
  }


  public addRelease(rawRelease: Release) {
    this.releaseAddModalStatus = ModalStatus.Submit;
    return getContext().request(APIPath.release_add, rawRelease).then(({ data }) => {
      this.releaseList.push(data);

      const currInstance = grootManager.state.getState('gs.componentInstance')
      const rootInstanceId = currInstance.rootId || currInstance.id

      return this.switchRelease(data.id, rootInstanceId);
    }).finally(() => {
      this.releaseAddModalStatus = ModalStatus.None;
    })
  }


  public switchRelease(releaseId: number, trackId?: number) {
    this.loadList(releaseId).then(() => {
      if (trackId) {
        getContext().request(APIPath.componentInstance_reverseDetectId, { releaseId, trackId }).then(({ data }) => {
          if (data) {
            grootManager.command.executeCommand('gc.fetch.instance', data)
          } else {
            const firstInstance = this.entryInstanceList[0]
            grootManager.command.executeCommand('gc.fetch.instance', firstInstance.id)
          }
        })
      } else {
        const firstInstance = this.entryInstanceList[0]
        grootManager.command.executeCommand('gc.fetch.instance', firstInstance.id)
      }
    })
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
    getContext().request(APIPath.asset_create_deploy, { bundleId: this.deployBundleId, ...formData }).then(({ data: deploy }) => {
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