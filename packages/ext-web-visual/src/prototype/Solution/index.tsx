import { Component, useRegisterModel } from "@grootio/common";
import { grootManager } from "context";
import { useEffect } from "react";
import ComponentAddModal from "./ComponentAddModal";
import ComponentItem from "./ComponentItem";
import ComponentVersionAddModal from "./ComponentVersionAddModal";

import SolutionModel from "./SolutionModel";
import SolutionManager from "./SolutionManager";
import SolutionVersionAddModal from "./SolutionVersionAddModal";
import { Menu } from "antd";

export const Solution = () => {
  const solutionModel = useRegisterModel(SolutionModel)

  useEffect(() => {
    solutionModel.init()
  }, [])

  const switchComponent = (component: Component) => {
    if (solutionModel.activeComponentId === component.id) {
      return;
    }
    solutionModel.activeComponentId = component.id
    grootManager.command.executeCommand('gc.openComponent', component.currVersionId)
  }

  const genTreeData = (list: Component[]) => {

    const treeMap = list.reduce((pre, item) => {
      pre.set(item.id, {
        key: item.id,
        label: <div onClick={() => {
          switchComponent(item)
        }}>
          <ComponentItem component={item} />
        </div>,
        parentComponentId: item.parentComponentId,
      })
      return pre;
    }, new Map())

    return [...treeMap.values()].filter(item => {
      if (item.parentComponentId) {
        let children = treeMap.get(item.parentComponentId).children
        if (!children) {
          treeMap.get(item.parentComponentId).children = [item]
        } else {
          children.push(item)
        }
        return false
      }
      return true
    })
  }

  return <div >
    <SolutionManager />
    <div >
      <Menu inlineIndent={0} selectedKeys={[solutionModel.activeComponentId?.toString()]} items={genTreeData(solutionModel.componentList)} mode="inline" />
    </div>

    <ComponentAddModal />
    <ComponentVersionAddModal />
    <SolutionVersionAddModal />
  </div >

}