import { ComponentInstance, } from "@grootio/common"
import { grootManager } from "context";

import styles from './index.module.less'

const InstanceItem: React.FC<{ instance: ComponentInstance }> = ({ instance }) => {
  const [currInstance] = grootManager.state.useStateByName('gs.componentInstance');

  return <div className={`${styles.componentItem} ${(currInstance.rootId || currInstance.id) === instance.id ? styles.active : ''}`}>
    <div className={styles.componentItemName}>
      {instance.name}
    </div>
    <div className={styles.componentItemVersion} onClick={(e) => e.stopPropagation()}>
    </div>

  </div>
}

export default InstanceItem