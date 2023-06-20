import { BranchesOutlined, CaretDownOutlined, PlusOutlined, SendOutlined } from "@ant-design/icons";
import { ComponentInstance, ModalStatus, useRegisterModel } from "@grootio/common";
import { Divider, Select, Space } from "antd";
import { useEffect } from "react";
import ApplicationModel from "./ApplicationModel";
import ComponentAddModal from "./InstanceAddModal";
import ComponentVersionAddModal from "./ReleaseAddModal";

import styles from './index.module.less'
import InstanceItem from "./InstanceItem";
import BuildModal from "./BuildModal";
import DeployModal from "./DeployModal";
import { grootManager } from "context";

export const Application = () => {
  const [currInstance] = grootManager.state.useStateByName('gs.activeComponentInstance');
  const applicationModel = useRegisterModel(ApplicationModel)
  const [release] = grootManager.state.useStateByName('gs.release')

  useEffect(() => {
    applicationModel.init()
  }, [])

  const switchEntry = (instance: ComponentInstance) => {
    grootManager.command.executeCommand('gc.switchEntry', instance.id)
  }

  if (!currInstance) {
    return null;
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
          applicationModel.entryInstanceList.map((instance) => {
            return (<div key={instance.id}
              className={`${styles.componentItem} ${(currInstance.rootId || currInstance.id) === instance.id ? styles.active : ''}`}
              onClick={() => switchEntry(instance)}>
              <InstanceItem instance={instance} />
            </div>)
          })
        }
        <Divider style={{ margin: '0 0 5px 0' }} />
        {
          applicationModel.mainEntryInstanceList.map((instance) => {
            return (<div key={instance.id}
              className={`${styles.componentItem} ${(currInstance.rootId || currInstance.id) === instance.id ? styles.active : ''}`}
              onClick={() => switchEntry(instance)}>
              <InstanceItem instance={instance} />
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