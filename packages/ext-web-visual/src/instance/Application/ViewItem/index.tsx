import { View, } from "@grootio/common"
import { grootManager } from "context";

import styles from './index.module.less'

const ViewItem: React.FC<{ view: View }> = ({ view }) => {
  const [currView] = grootManager.state.useStateByName('gs.view');

  return <div className={`${styles.componentItem} ${(currView?.viewId) === view.id ? styles.active : ''}`}>
    <div className={styles.componentItemName}>
      {view.name}
    </div>
    <div className={styles.componentItemVersion} onClick={(e) => e.stopPropagation()}>
    </div>

  </div>
}

export default ViewItem