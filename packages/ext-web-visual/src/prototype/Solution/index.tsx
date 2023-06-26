import { Component, useRegisterModel } from "@grootio/common";
import { grootManager } from "context";
import { useEffect } from "react";
import ComponentAddModal from "./ComponentAddModal";
import ComponentItem from "./ComponentItem";
import ComponentVersionAddModal from "./ComponentVersionAddModal";

import styles from './index.module.less'
import SolutionModel from "./SolutionModel";
import SolutionManager from "./SolutionManager";
import SolutionVersionAddModal from "./SolutionVersionAddModal";

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

  return <div className={styles.container}>
    <SolutionManager />
    <div >
      {
        solutionModel.componentList.map((component) => {
          return (<div key={component.id}
            className={`${styles.componentItem} ${solutionModel.activeComponentId === component.id ? styles.active : ''}`}
            onClick={() => switchComponent(component)}>
            <ComponentItem component={component} />
          </div>)
        })
      }
    </div>

    <ComponentAddModal />
    <ComponentVersionAddModal />
    <SolutionVersionAddModal />
  </div >

}