import { APIPath, BaseModel, pick, State } from "@grootio/common";
import { getContext, grootManager } from "context";

export default class StateModel extends BaseModel {
  static modelName = 'state';

  formVisible = false;
  currState: State;
  isGlobalState = false;


  showForm(isGlobal: boolean, data?: State) {
    this.formVisible = true;
    this.isGlobalState = isGlobal;
    this.currState = data;
  }

  hideForm() {
    this.formVisible = false;
    this.currState = null;
  }

  addState(rawState: State) {
    rawState.releaseId = grootManager.state.getState('gs.release').id

    if (!this.isGlobalState) {
      rawState.instanceId = grootManager.state.getState('gs.componentInstance').id
    }
    getContext().request(APIPath.state_add, rawState).then((res) => {
      if (this.isGlobalState) {
        const globalStateList = grootManager.state.getState('gs.globalStateList');
        globalStateList.push(res.data);
      } else {
        const localSttateList = grootManager.state.getState('gs.localStateList');
        localSttateList.push(res.data);
      }
      this.hideForm();
    });
  }

  updateState(rawState: State) {
    getContext().request(APIPath.state_update, { id: this.currState.id, ...rawState }).then((res) => {
      const list = this.isGlobalState ? grootManager.state.getState('gs.globalStateList') : grootManager.state.getState('gs.localStateList');
      const originState = list.find(item => item.id === this.currState.id);
      Object.assign(originState, pick(res.data, ['type', 'name', 'value']));

      this.hideForm();
    });
  }

  removeState() {
    getContext().request(APIPath.state_remove_stateId, { stateId: this.currState.id }).then(() => {
      const list = this.isGlobalState ? grootManager.state.getState('gs.globalStateList') : grootManager.state.getState('gs.localStateList');

      const index = list.findIndex((item) => item.id === this.currState.id);
      if (index !== -1) {
        list.splice(index, 1);
      }

      this.hideForm();
    });
  }
}