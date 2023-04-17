import { Button, Radio, Space } from "antd"
import { grootManager } from "context"

import styles from './index.module.less'

const ToolBar = () => {
  const [viewportMode, setViewportMode] = grootManager.state.useStateByName('gs.ui.stageViewport')
  return <div className={styles.container}>

    <Space>
      <Radio.Group size="small" value={viewportMode} >
        <Radio.Button value="desktop" onClick={() => setViewportMode('desktop')}>桌面</Radio.Button>
        <Radio.Button value="mobile" onClick={() => setViewportMode('mobile')}>手机</Radio.Button>
      </Radio.Group>

      <Button size="small">预览</Button>
    </Space>
  </div>
}

export default ToolBar