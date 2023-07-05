import { BranchesOutlined, CaretDownOutlined, PlusOutlined, SendOutlined } from "@ant-design/icons";
import { ModalStatus, View, useRegisterModel } from "@grootio/common";
import { Divider, Select, Space } from "antd";
import { useEffect } from "react";
import ApplicationModel from "./ApplicationModel";
import ComponentAddModal from "./InstanceAddModal";
import ComponentVersionAddModal from "./ReleaseAddModal";

import styles from './index.module.less'
import ViewItem from "./ViewItem";
import BuildModal from "./BuildModal";
import DeployModal from "./DeployModal";
import { grootManager } from "context";

export const Application = () => {
  const [currView] = grootManager.state.useStateByName('gs.view');
  const applicationModel = useRegisterModel(ApplicationModel)
  const [release] = grootManager.state.useStateByName('gs.release')

  useEffect(() => {
    applicationModel.init()
  }, [])

  const openView = (view: View) => {
    grootManager.command.executeCommand('gc.openView', view.id)
  }


  return <div className={styles.container}>
    <div>
      <div className={styles.componentItemHeader}>
        <div style={{ flexGrow: 1 }}>
          {
            applicationModel.releaseList && (
              <Select
                onChange={(e) => applicationModel.switchRelease(e)}
                value={release.id}
                suffixIcon={<CaretDownOutlined />}
                dropdownMatchSelectWidth={false}
                bordered={false}
                fieldNames={{ label: 'name', value: 'id' }}
                options={applicationModel.releaseList}
              />
            )
          }
        </div>

        <Space size="small">
          <SendOutlined onClick={() => {
            applicationModel.assetBuildModalStatus = ModalStatus.Init;
          }} />
          <BranchesOutlined onClick={() => {
            applicationModel.releaseAddModalStatus = ModalStatus.Init
          }} />
          <PlusOutlined onClick={() => {
            applicationModel.instanceAddModalStatus = ModalStatus.Init
          }} />
        </Space>
      </div>
      <div >
        {
          applicationModel.noPrimaryViewList.map((view) => {
            return (<div key={view.id}
              className={`${styles.componentItem} ${currView?.viewId === view.id ? styles.active : ''}`}
              onClick={() => openView(view)}>
              <ViewItem view={view} />
            </div>)
          })
        }
        <Divider style={{ margin: '0 0 5px 0' }} />
        {
          applicationModel.primaryViewList.map((view) => {
            return (<div key={view.id}
              className={`${styles.componentItem} ${currView?.viewId === view.id ? styles.active : ''}`}
              onClick={() => openView(view)}>
              <ViewItem view={view} />
            </div>)
          })
        }
      </div>
    </div>


    <ComponentAddModal />
    <ComponentVersionAddModal />
    <BuildModal />
    <DeployModal />
  </div >

}