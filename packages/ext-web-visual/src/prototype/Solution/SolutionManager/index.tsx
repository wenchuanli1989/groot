import { ModalStatus, useModel } from '@grootio/common'
import styles from './index.module.less'
import SolutionModel from '../SolutionModel'
import { CaretDownOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons'
import { Button, Select } from 'antd'
import { grootManager } from 'context'

const SolutionManager = () => {
  const solutionModel = useModel(SolutionModel)

  const onSwitchVersion = (solutionVersionId: number) => {
    solutionModel.currSolutionVersionId = solutionVersionId;
    grootManager.command.executeCommand('gc.navSolution', solutionVersionId, solutionModel.activeComponentId)
  }

  return <div className={styles.componentItemHeader}>
    <div style={{ flexGrow: 1 }}>组件</div>
    <div >
      <Button icon={<PlusOutlined />} type="link" onClick={() => {
        solutionModel.componentAddModalStatus = ModalStatus.Init
      }} />
      <Button icon={<SendOutlined />} type="link" onClick={() => {
        solutionModel.solutionVersionAddModalStatus = ModalStatus.Init
      }} />

      <Select
        onChange={onSwitchVersion}
        value={solutionModel.currSolutionVersionId}
        suffixIcon={<CaretDownOutlined />}
        dropdownMatchSelectWidth={false}
        bordered={false}
        fieldNames={{ label: 'name', value: 'id' }}
        options={solutionModel.solutionVersionList}
      />
    </div>
  </div>
}

export default SolutionManager;