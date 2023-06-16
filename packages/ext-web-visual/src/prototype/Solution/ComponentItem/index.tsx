import { CaretDownOutlined, PlusOutlined, SendOutlined } from "@ant-design/icons"
import { Component, ModalStatus, useModel } from "@grootio/common"
import { Modal, Select, Space } from "antd"
import { grootManager } from "context"
import { useEffect } from "react"
import SolutionModel from "../SolutionModel"

import styles from './index.module.less'

const ComponentItem: React.FC<{ component: Component }> = ({ component }) => {
  const solutionModel = useModel(SolutionModel)
  const [currComponent] = grootManager.state.useStateByName('gs.component');

  useEffect(() => {
    component.componentVersionId = component.recentVersionId
  }, [])

  const onSwitchVersion = (value) => {
    component.componentVersionId = value
    // todo-reload grootManager.command.executeCommand('gc.fetch.prototype', component.id, value)
  }

  return <div className={`${styles.componentItem} ${currComponent?.id === component.id ? styles.active : ''}`}>
    <div className={styles.componentItemName}>
      {component.name}
    </div>
    <div className={styles.componentItemVersion} onClick={(e) => e.stopPropagation()}>
      <Space size="small">
        <PlusOutlined onClick={() => {
          solutionModel.component = component;
          solutionModel.componentVersionAddModalStatus = ModalStatus.Init
        }} />

        {
          component.recentVersionId !== component.componentVersionId ? (
            <SendOutlined onClick={() => {
              Modal.confirm({
                title: '确定发布版本',
                content: '发布之后版本无法更新',
                onOk: () => {
                  solutionModel.publish(component)
                }
              })
            }} />
          ) : null
        }
      </Space>
      <Select
        onChange={onSwitchVersion}
        value={component.componentVersionId}
        suffixIcon={<CaretDownOutlined />}
        dropdownMatchSelectWidth={false}
        defaultValue={component.recentVersionId}
        bordered={false}
        fieldNames={{ label: 'name', value: 'id' }}
        options={component.versionList}
      />
    </div>

  </div>
}

export default ComponentItem