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

    const listMap = list.reduce((pre, item) => {
      pre.set(item.id, {
        item,
        menu: {
          key: item.id.toString(),
          label: <div onClick={() => {
            switchSolutionComponent(item)
          }}>
            <ComponentItem solutionComponent={item} />
          </div>,
          children: undefined
        }
      })
      return pre;
    }, new Map<number, { item: SolutionComponent, menu: SubMenuType }>())

    return [...listMap.values()].filter(({ item, menu }) => {
      if (item.parentId) {
        let children = listMap.get(item.parentId).menu.children
        if (!children) {
          listMap.get(item.parentId).menu.children = [menu]
        } else {
          children.push(menu)
        }
        return false
      }
      return true
    }).map(item => item.menu)
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