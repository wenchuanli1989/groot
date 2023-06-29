import { CaretDownOutlined, SettingOutlined } from "@ant-design/icons"
import { ModalStatus, SolutionComponent, useModel } from "@grootio/common"
import { Dropdown, Modal, Popconfirm, Select, Space, } from "antd"
import SolutionModel from "../SolutionModel"

import styles from './index.module.less'
import { grootManager } from "context"

const ComponentItem: React.FC<{ solutionComponent: SolutionComponent }> = ({ solutionComponent }) => {
  const solutionModel = useModel(SolutionModel)

  const onSwitchVersion = (versionId) => {
    solutionComponent.currVersionId = versionId
    solutionModel.activeSolutionComponentId = solutionComponent.id;
    grootManager.command.executeCommand('gc.openComponent', versionId)
  }

  let versionStyle = '';
  if (solutionComponent.currVersionId !== solutionComponent.componentVersionId) {
    versionStyle = styles.versionChange
  } else if (solutionComponent.componentVersionId !== solutionComponent.component.recentVersionId) {
    versionStyle = styles.versionFallBehind
  }

  const dropMenus = [
    {
      key: 'version',
      label: '添加版本',
      onClick: () => {
        solutionModel.componentVersionAddModalStatus = ModalStatus.Init
      }
    }, {
      key: 'removeComponentVersion',
      label: <Popconfirm title="确定删除版本吗"
        onConfirm={() => {
          solutionModel.removeComponentVersion(solutionComponent)
        }}
        okText="删除"
        cancelText="取消">
        删除版本
      </Popconfirm>
    }, {
      key: 'remove',
      label: <Popconfirm title="确定删除吗"
        onConfirm={() => {
          solutionModel.removeSolutionComponent(solutionComponent.id)
        }}
        okText="删除"
        cancelText="取消">
        删除
      </Popconfirm>

    }
  ]

  if (!solutionComponent.parentId) {
    dropMenus.push({
      key: 'add',
      label: '添加子组件',
      onClick: () => {
        solutionModel.componentAddModalStatus = ModalStatus.Init
        solutionModel.parentIdForAddComponent = solutionComponent.id
      }
    })
  }

  if (solutionComponent.currVersionId !== solutionComponent.componentVersionId) {
    dropMenus.push({
      key: 'publish',
      label: '发布版本',
      onClick: () => {
        Modal.confirm({
          title: '确定发布版本',
          content: '发布之后版本无法更新',
          onOk: () => {
            solutionModel.publish(solutionComponent)
          }
        })
      }
    })
  }

  return <div className={`${styles.componentItem} `}>
    <div className={styles.componentItemName}>
      <Space>
        <span>{solutionComponent.component.name}</span>

        {solutionModel.activeSolutionComponentId === solutionComponent.id && (
          <Dropdown menu={{ items: dropMenus }} placement="bottomRight" >
            <SettingOutlined />
          </Dropdown>
        )}
      </Space>

    </div>
    <div className={styles.componentItemVersion} onClick={(e) => e.stopPropagation()}>

      <Select
        className={versionStyle}
        onChange={onSwitchVersion}
        value={solutionComponent.currVersionId}
        suffixIcon={<CaretDownOutlined />}
        dropdownMatchSelectWidth={false}
        defaultValue={solutionComponent.component.recentVersionId}
        bordered={false}
        fieldNames={{ label: 'name', value: 'id' }}
        options={solutionComponent.component.versionList}
      />

    </div>

  </div >
}

export default ComponentItem