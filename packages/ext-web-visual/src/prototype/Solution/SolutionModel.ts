import { APIPath, BaseModel, Component, ComponentVersion, ModalStatus } from "@grootio/common";
import { getContext, grootManager } from "context";

export default class SolutionModel extends BaseModel {
  static modelName = 'SolutionModel';

  componentAddModalStatus: ModalStatus = ModalStatus.None
  componentVersionAddModalStatus: ModalStatus = ModalStatus.None
  componentList: Component[] = [];
  componentIdForAddComponentVersion: number
  activeComponentId: number

  public addComponent(rawComponent: Component) {
    this.componentAddModalStatus = ModalStatus.Submit;
    getContext().request(APIPath.component_add, {
      ...rawComponent,
      solutionVersionId: grootManager.state.getState('gs.solution').solutionVersion.id
    }).then(({ data }) => {
      this.componentAddModalStatus = ModalStatus.None;
      this.componentList.push(data)
      data.versionList = [data.componentVersion]
      data.currVersionId = data.componentVersion.id
      data.activeVersionId = data.componentVersion.id;

      this.activeComponentId = data.id;
      grootManager.command.executeCommand('gc.openComponent', data.recentVersionId)
    });
  }

  public loadList() {
    this.activeComponentId = grootManager.state.getState('gs.component').id

    getContext().request(APIPath.solution_componentList_solutionVersionId, { solutionVersionId: 1, all: true, allVersion: true }).then(({ data }) => {
      this.componentList = data;
      data.forEach(item => {
        item.currVersionId = item.activeVersionId
      })
    })
  }

  public addComponentVersion(rawComponentVersion: ComponentVersion) {
    this.componentVersionAddModalStatus = ModalStatus.Submit;
    getContext().request(APIPath.componentVersion_add, rawComponentVersion).then(({ data }) => {
      this.componentVersionAddModalStatus = ModalStatus.None;
      const component = this.componentList.find(item => item.id === this.componentIdForAddComponentVersion)
      component.versionList = [...component.versionList, data]
      component.currVersionId = data.id

      this.activeComponentId = component.id
      grootManager.command.executeCommand('gc.openComponent', data.id)
    });
  }

  public publish = (component: Component) => {
    const componentVersionId = component.currVersionId
    getContext().request(APIPath.componentVersion_publish, { componentVersionId }).then(() => {
      component.recentVersionId = componentVersionId;
    });
  }
}