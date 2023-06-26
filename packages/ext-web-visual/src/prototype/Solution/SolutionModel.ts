import { APIPath, BaseModel, Component, ComponentVersion, ModalStatus, SolutionVersion } from "@grootio/common";
import { getContext, grootManager } from "context";

export default class SolutionModel extends BaseModel {
  static modelName = 'SolutionModel';

  componentAddModalStatus: ModalStatus = ModalStatus.None
  componentVersionAddModalStatus: ModalStatus = ModalStatus.None
  solutionVersionAddModalStatus: ModalStatus = ModalStatus.None
  componentList: Component[] = [];
  componentIdForAddComponentVersion: number
  activeComponentId: number
  solutionVersionList: SolutionVersion[]
  currSolutionVersionId: number

  public init() {
    this.solutionVersionList = grootManager.state.getState('gs.solution').versionList
    this.currSolutionVersionId = +getContext().params.solutionVersionId

    grootManager.state.watchState('gs.component', (newComponent) => {
      if (this.activeComponentId !== newComponent?.id) {
        this.activeComponentId = newComponent.id
      }
    })

    this.loadList()
  }

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
    getContext().request(APIPath.solution_componentList_solutionVersionId, { solutionVersionId: this.currSolutionVersionId, all: true, allVersion: true }).then(({ data }) => {
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

  public publish(component: Component) {
    const componentVersionId = component.currVersionId
    getContext().request(APIPath.componentVersion_publish, { componentVersionId }).then(() => {
      component.recentVersionId = componentVersionId;
    });
  }

  public addSolutionVersion(imageVersionId: number, name: string) {
    getContext().request(APIPath.solutionVersion_add, { imageVersionId, name }).then(({ data }) => {
      grootManager.command.executeCommand('gc.navSolution', data.id, this.activeComponentId)
    })
  }

  public removeComponentVersion(component: Component) {
    const solutionVersionId = +getContext().params.solutionVersionId
    getContext().request(APIPath.solutionVersion_removeComponentVersion, { solutionVersionId, componentVersionId: component.activeVersionId }).then(() => {
      this.componentList = this.componentList.filter(item => item.id !== component.id)

      if (this.activeComponentId === component.id) {
        const newActiveComponent = this.componentList[0]
        this.activeComponentId = newActiveComponent.id
        grootManager.command.executeCommand('gc.openComponent', newActiveComponent.activeVersionId)
      }
    })
  }
}