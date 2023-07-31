import { APIPath, BaseModel, Component, ComponentVersion, ModalStatus, SolutionComponent, SolutionVersion } from "@grootio/common";
import { getContext, grootManager } from "context";

export default class SolutionModel extends BaseModel {
  static modelName = 'SolutionModel';

  componentAddModalStatus: ModalStatus = ModalStatus.None
  componentVersionAddModalStatus: ModalStatus = ModalStatus.None
  solutionVersionAddModalStatus: ModalStatus = ModalStatus.None
  solutionVersionList: SolutionVersion[]
  solutionComponentList: SolutionComponent[] = [];
  currSolutionVersionId: number;
  activeSolutionComponentId: number;
  parentIdForAddComponent?: number;
  syncVersionDoing = false

  public init() {
    this.solutionVersionList = grootManager.state.getState('gs.solution').versionList
    this.currSolutionVersionId = +getContext().params.solutionVersionId

    // grootManager.state.watchState('gs.component', (newComponent) => {
    //   if (this.activeComponentId !== newComponent?.id) {
    //     this.activeComponentId = newComponent.id
    //   }
    // })

    this.loadList()
  }

  public addComponent(rawComponent: Component) {
    this.componentAddModalStatus = ModalStatus.Submit;

    getContext().request(APIPath.solutionComponent_addComponent, {
      component: {
        ...rawComponent,
        solutionVersionId: grootManager.state.getState('gs.solution').solutionVersion.id
      },
      parentId: this.parentIdForAddComponent
    }).then(({ data: solutionComponent }) => {
      this.componentAddModalStatus = ModalStatus.None;
      this.solutionComponentList.push(solutionComponent)
      solutionComponent.component.versionList = [solutionComponent.component.componentVersion]
      solutionComponent.currVersionId = solutionComponent.componentVersionId
      this.activeSolutionComponentId = solutionComponent.id;

      grootManager.command.executeCommand('gc.openComponent', solutionComponent.currVersionId)
    }).catch(() => {
      this.componentAddModalStatus = ModalStatus.Error
    })
  }

  public loadList() {
    getContext().request(APIPath.solutionComponent_list_solutionVersionId, {
      solutionVersionId: this.currSolutionVersionId,
      view: 'all', queryVersionList: true, queryTagList: true
    }).then(({ data }) => {
      const tagMap = new Map<number, SolutionComponent[]>()
      for (const solutionComponent of data) {
        for (const tag of (solutionComponent.markTagList || [])) {
          if (!tagMap.has(tag.id)) {
            tagMap.set(tag.id, [solutionComponent])
          } else {
            tagMap.get(tag.id).push(solutionComponent)
          }
        }
      }
      for (const solutionComponent of data) {
        if (solutionComponent.consumeTagList?.length) {
          solutionComponent.children = []
        }

        for (const tag of (solutionComponent.consumeTagList || [])) {
          const list = tagMap.get(tag.id) || []
          solutionComponent.children.push(...list)
        }
      }
      this.solutionComponentList = data;

      data.forEach(item => {
        item.currVersionId = item.componentVersionId
      })
    })
  }

  public addComponentVersion(rawComponentVersion: ComponentVersion) {
    this.componentVersionAddModalStatus = ModalStatus.Submit;
    getContext().request(APIPath.componentVersion_add, rawComponentVersion).then(({ data: componenttVersion }) => {
      this.componentVersionAddModalStatus = ModalStatus.None;
      const solutionComponent = this.solutionComponentList.find(item => item.id === this.activeSolutionComponentId)
      solutionComponent.component.versionList = [...solutionComponent.component.versionList, componenttVersion]
      solutionComponent.currVersionId = componenttVersion.id

      grootManager.command.executeCommand('gc.openComponent', componenttVersion.id)
    }).catch(() => {
      this.componentVersionAddModalStatus = ModalStatus.Init;
    })
  }

  public publish(solutionComponent: SolutionComponent) {
    const componentVersionId = solutionComponent.currVersionId
    getContext().request(APIPath.componentVersion_publish, { componentVersionId }).then(() => {
      solutionComponent.componentVersionId = componentVersionId
    });
  }

  public addSolutionVersion(imageVersionId: number, name: string) {
    getContext().request(APIPath.solutionVersion_add, { imageVersionId, name }).then(({ data }) => {
      grootManager.command.executeCommand('gc.navSolution', data.id)
    })
  }

  public removeComponentVersion(solutionComponent: SolutionComponent) {
    const solutionVersionId = +getContext().params.solutionVersionId
    const data = { solutionVersionId, componentVersionId: solutionComponent.currVersionId }
    getContext().request(APIPath.componentVersion_remove, data).then(() => {
      const { component } = solutionComponent
      component.versionList = component.versionList.filter(item => item.id !== data.componentVersionId)
      solutionComponent.currVersionId = solutionComponent.componentVersionId
      grootManager.command.executeCommand('gc.openComponent', solutionComponent.currVersionId)
    })
  }

  public removeSolutionComponent(solutionComponentId: number) {
    getContext().request(APIPath.solutionComponent_remove, { solutionComponentId }).then(() => {
      this.solutionComponentList = this.solutionComponentList.filter(item => item.id !== solutionComponentId)
      if (this.activeSolutionComponentId === solutionComponentId && this.solutionComponentList.length > 0) {
        this.activeSolutionComponentId = this.solutionComponentList[0].id
        grootManager.command.executeCommand('gc.openComponent', this.activeSolutionComponentId)
      }
    })
  }


  public syncVersion() {
    this.syncVersionDoing = true
    const newSolutionComponentList = this.solutionComponentList.map(item => {
      return {
        id: item.id,
        componentVersionId: item.currVersionId
      } as SolutionComponent
    })
    getContext().request(APIPath.solutionComponent_syncVersion, {
      solutionVersionId: +getContext().params.solutionVersionId,
      newSolutionComponentList
    }).then(() => {
      this.solutionComponentList.forEach(item => {
        item.componentVersionId = item.currVersionId
      })
    }).finally(() => {
      this.syncVersionDoing = false
    })
  }
}