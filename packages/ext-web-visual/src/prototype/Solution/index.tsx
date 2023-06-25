import { PlusOutlined } from "@ant-design/icons";
import { Component, ModalStatus, useRegisterModel } from "@grootio/common";
import { Button } from "antd";
import { grootManager } from "context";
import { useEffect } from "react";
import ComponentAddModal from "./ComponentAddModal";
import ComponentItem from "./ComponentItem";
import ComponentVersionAddModal from "./ComponentVersionAddModal";

import styles from './index.module.less'
import SolutionModel from "./SolutionModel";

export const Solution = () => {
  const solutionModel = useRegisterModel(SolutionModel)

  useEffect(() => {
    solutionModel.loadList();
  }, [])

  const switchComponent = (component: Component) => {
    if (solutionModel.currComponentId === component.id) {
      return;
    }
    grootManager.command.executeCommand('gc.openComponent', component.id)
    solutionModel.currComponentId = component.id
  }

  return <div className={styles.container}>
    <div>
      <div className={styles.componentItemHeader}>
        <div style={{ flexGrow: 1 }}>组件</div>
        <div >
          <Button icon={<PlusOutlined />} type="link" onClick={() => {
            solutionModel.componentAddModalStatus = ModalStatus.Init
          }} />
        </div>
      </div>
      <div >
        {
          solutionModel.componentList.map((component) => {
            return (<div key={component.id}
              className={`${styles.componentItem} ${solutionModel.currComponentId === component.id ? styles.active : ''}`}
              onClick={() => switchComponent(component)}>
              <ComponentItem component={component} />
            </div>)
          })
        }
      </div>
    </div>

    <ComponentAddModal />
    <ComponentVersionAddModal />
  </div >

}