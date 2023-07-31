import { SolutionComponent, useRegisterModel } from "@grootio/common";
import { grootManager } from "context";
import { useEffect } from "react";
import ComponentAddModal from "./ComponentAddModal";
import ComponentItem from "./ComponentItem";
import ComponentVersionAddModal from "./ComponentVersionAddModal";

import SolutionModel from "./SolutionModel";
import SolutionManager from "./SolutionManager";
import SolutionVersionAddModal from "./SolutionVersionAddModal";
import { Menu } from "antd";
import { SubMenuType } from "antd/es/menu/hooks/useItems";

export const Solution = () => {
  const solutionModel = useRegisterModel(SolutionModel)

  useEffect(() => {
    solutionModel.init()
  }, [])

  const switchSolutionComponent = (solutionComponent: SolutionComponent) => {
    if (solutionModel.activeSolutionComponentId === solutionComponent.id) {
      return;
    }
    solutionModel.activeSolutionComponentId = solutionComponent.id
    grootManager.command.executeCommand('gc.openComponent', solutionComponent.currVersionId)
  }

  const genTreeData = (list: SolutionComponent[]) => {

    const menuList = list.map((item) => {
      const menuItem = {
        key: item.id.toString(),
        label: <div onClick={() => {
          switchSolutionComponent(item)
        }}>
          <ComponentItem solutionComponent={item} isRoot />
        </div>,
        children: undefined
      }

      if (item.children) {
        menuItem.children = []

        for (const childrenItem of item.children) {
          menuItem.children.push({
            key: childrenItem.id.toString(),
            label: <div onClick={() => {
              switchSolutionComponent(childrenItem)
            }}>
              <ComponentItem solutionComponent={childrenItem} isRoot={false} />
            </div>,
          })
        }
      }

      return menuItem;
    })


    return menuList
  }

  return <div >
    <SolutionManager />
    <div >
      <Menu inlineIndent={0} selectedKeys={[solutionModel.activeSolutionComponentId?.toString()]} items={genTreeData(solutionModel.solutionComponentList)} mode="inline" />
    </div>

    <ComponentAddModal />
    <ComponentVersionAddModal />
    <SolutionVersionAddModal />
  </div >

}