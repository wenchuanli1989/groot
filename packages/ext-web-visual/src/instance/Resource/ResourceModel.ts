import { APIPath, BaseModel, pick, Resource } from "@grootio/common";
import { getContext, grootManager } from "context";

export default class ResourceModel extends BaseModel {
  static modelName = 'resource';

  formVisible = false;
  currResource: Resource;
  isGlobalResource = false;


  showForm(isGlobal: boolean, data?: Resource) {
    this.formVisible = true;
    this.isGlobalResource = isGlobal;
    this.currResource = data;
  }

  hideForm() {
    this.formVisible = false;
    this.currResource = null;
  }

  addResource(rawResource: Resource) {
    rawResource.releaseId = grootManager.state.getState('gs.release').id

    if (!this.isGlobalResource) {
      rawResource.instanceId = grootManager.state.getState('gs.componentInstance').id
    }
    getContext().request(APIPath.resource_add, rawResource).then((res) => {
      if (this.isGlobalResource) {
        const globalResourceList = grootManager.state.getState('gs.globalResourceList');
        globalResourceList.push(res.data);
      } else {
        const localSttateList = grootManager.state.getState('gs.localResourceList');
        localSttateList.push(res.data);
      }
      this.hideForm();
    });
  }

  updateResource(rawResource: Resource) {
    getContext().request(APIPath.resource_update, { id: this.currResource.id, ...rawResource }).then((res) => {
      const list = this.isGlobalResource ? grootManager.state.getState('gs.globalResourceList') : grootManager.state.getState('gs.localResourceList');
      const originResource = list.find(item => item.id === this.currResource.id);
      Object.assign(originResource, pick(res.data, ['type', 'name', 'value']));

      this.hideForm();
    });
  }

  removeResource() {
    getContext().request(APIPath.resource_remove_resourceId, { resourceId: this.currResource.id }).then(() => {
      const list = this.isGlobalResource ? grootManager.state.getState('gs.globalResourceList') : grootManager.state.getState('gs.localResourceList');

      const index = list.findIndex((item) => item.id === this.currResource.id);
      if (index !== -1) {
        list.splice(index, 1);
      }

      this.hideForm();
    });
  }
}