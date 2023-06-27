import { BlockOutlined, CaretDownOutlined, DeleteOutlined, SendOutlined } from "@ant-design/icons"
import { Component, ModalStatus, useModel } from "@grootio/common"
import { Modal, Popconfirm, Select, Space } from "antd"
import SolutionModel from "../SolutionModel"

import styles from './index.module.less'
import { grootManager } from "context"

const ComponentItem: React.FC<{ component: Component }> = ({ component }) => {
  const solutionModel = useModel(SolutionModel)

  const onSwitchVersion = (versionId) => {
    component.currVersionId = versionId
    solutionModel.activeComponentId = component.id;
    grootManager.command.executeCommand('gc.openComponent', versionId)
  }

  let versionStyle = '';
  if (component.currVersionId !== component.activeVersionId) {
    versionStyle = styles.versionChange
  } else if (component.activeVersionId !== component.recentVersionId) {
    versionStyle = styles.versionFallBehind
  }
  return <div className={`${styles.componentItem} ${solutionModel.activeComponentId === component.id || component.activeVersionId !== component.currVersionId ? styles.active : ''}`}>
    <div className={styles.componentItemName}>
      {component.name}
    </div>
    <div className={styles.componentItemVersion} onClick={(e) => e.stopPropagation()}>
      <Space size="small">
        <Popconfirm title="确定删除吗"
          onConfirm={() => {
            solutionModel.removeComponentVersion(component)
          }}
          okText="删除"
          cancelText="取消">
          <DeleteOutlined />
        </Popconfirm>

        <BlockOutlined onClick={() => {
          solutionModel.componentIdForAddComponentVersion = component.id;
          solutionModel.componentVersionAddModalStatus = ModalStatus.Init
        }} />


        {
          component.currVersionId !== component.activeVersionId ? (
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
        className={versionStyle}
        onChange={onSwitchVersion}
        value={component.currVersionId}
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