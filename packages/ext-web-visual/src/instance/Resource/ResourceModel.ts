import { APIPath, AppResource, BaseModel, InstanceResource, pick, PostMessageType, Resource } from "@grootio/common";
import { getContext, grootManager } from "context";

export default class ResourceModel extends BaseModel {
  static modelName = 'resource';

  formVisible = false;
  currResource: Resource;
  isLocalResource = false;


  showForm(isLocal: boolean, data?: Resource) {
    this.formVisible = true;
    this.isLocalResource = isLocal;
    this.currResource = data;
  }

  hideForm() {
    this.formVisible = false;
    this.currResource = null;
  }

  addResource(rawResource: Resource) {
    const releaseId = grootManager.state.getState('gs.release').id

    if (this.isLocalResource) {
      const componentInstanceId = grootManager.state.getState('gs.activeComponentInstance').id
      const data = rawResource as InstanceResource
      data.releaseId = releaseId
      data.componentInstanceId = componentInstanceId
      getContext().request(APIPath.resource_add_instance_resource, data).then((res) => {
        const localSttateList = grootManager.state.getState('gs.localResourceList');
        localSttateList.push(res.data as Resource);
        const entryId = grootManager.state.getState('gs.entry').id
        grootManager.command.executeCommand('gc.pushResource', entryId)
        this.hideForm();
      })
    } else {
      const data = rawResource as AppResource
      data.releaseId = releaseId
      data.appId = grootManager.state.getState('gs.app').id
      getContext().request(APIPath.resource_add_app_resource, data).then((res) => {
        const globalResourceList = grootManager.state.getState('gs.globalResourceList');
        globalResourceList.push(res.data as Resource);
        grootManager.command.executeCommand('gc.pushResource')
        this.hideForm();
      })
    }

  }

  updateResource(rawResource: Resource) {
    getContext().request(this.isLocalResource ? APIPath.resource_update_instance_resource : APIPath.resource_update_app_resource, { id: this.currResource.id, ...rawResource } as any).then((res) => {
      const list = this.isLocalResource ? grootManager.state.getState('gs.localResourceList') : grootManager.state.getState('gs.globalResourceList') as any[];
      const originResource = list.find(item => item.id === this.currResource.id);
      Object.assign(originResource, pick(res.data, ['type', 'name', 'value']));
      const entryId = this.isLocalResource ? grootManager.state.getState('gs.entry').id : undefined
      grootManager.command.executeCommand('gc.pushResource', entryId)
      this.hideForm();
    });
  }

  removeResource() {
    const type = this.isLocalResource ? 'instance' : 'app'
    getContext().request(APIPath.resource_remove_resourceId, { resourceId: this.currResource.id, type }).then(() => {
      const list = this.isLocalResource ? grootManager.state.getState('gs.localResourceList') : grootManager.state.getState('gs.globalResourceList')

      const index = list.findIndex((item) => item.id === this.currResource.id);
      if (index !== -1) {
        list.splice(index, 1);
      }
      const entryId = this.isLocalResource ? grootManager.state.getState('gs.entry').id : undefined
      grootManager.command.executeCommand('gc.pushResource', entryId)
      this.hideForm();
    });
  }
}