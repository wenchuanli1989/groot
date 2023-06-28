import { CaretDownOutlined, SettingOutlined } from "@ant-design/icons"
import { Component, ModalStatus, useModel } from "@grootio/common"
import { Dropdown, Modal, Popconfirm, Select, } from "antd"
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

  const dropMenus = [
    {
      key: 'version',
      label: '添加版本',
      onClick: () => {
        solutionModel.componentIdForAddComponentVersion = component.id;
        solutionModel.componentVersionAddModalStatus = ModalStatus.Init
      }
    }, {
      key: 'remove',
      label: <Popconfirm title="确定删除吗"
        onConfirm={() => {
          solutionModel.removeComponentVersion(component)
        }}
        okText="删除"
        cancelText="取消">
        删除版本
      </Popconfirm>
    }
  ]

  if (!component.parentComponentId) {
    dropMenus.push({
      key: 'add',
      label: '添加子组件',
      onClick: () => {
        solutionModel.parentComponentVersionId = component.currVersionId
        solutionModel.parentComponentId = component.id
        solutionModel.componentAddModalStatus = ModalStatus.Init
      }
    })
  }

  if (component.currVersionId !== component.activeVersionId) {
    dropMenus.push({
      key: 'publish',
      label: '发布版本',
      onClick: () => {
        Modal.confirm({
          title: '确定发布版本',
          content: '发布之后版本无法更新',
          onOk: () => {
            solutionModel.publish(component)
          }
        })
      }
    })
  }

  return <div className={`${styles.componentItem} `}>
    <div className={styles.componentItemName}>
      {component.name}
    </div>
    <div className={styles.componentItemVersion} onClick={(e) => e.stopPropagation()}>

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

      <Dropdown menu={{ items: dropMenus }} placement="bottomRight" >
        <SettingOutlined />
      </Dropdown>

    </div>

  </div >
}

export default ComponentItem