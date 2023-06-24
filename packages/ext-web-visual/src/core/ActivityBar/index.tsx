import { mapFilter, viewRender } from "@grootio/common";
import { grootManager } from "context";
import styles from './index.module.less';


const ActivityBar: React.FC = () => {
  const { useStateByName } = grootManager.state
  const [viewKeys] = useStateByName('gs.ui.activityBar.viewContainers');
  const [viewContainerMap] = useStateByName('gs.ui.viewContainerMap');
  const [active, setActive] = useStateByName('gs.ui.activityBar.active', '');

  const items = mapFilter(viewContainerMap, (key) => viewKeys.has(key))

  const change = (key: string) => {
    setActive(key);
    grootManager.state.setState('gs.ui.primarySidebar.active', key);
  }

  return <div className={styles.container}>

    <div className={styles.topContainer}>
      {items.map((item) => {
        return <span key={item.id} onClick={() => change(item.id)} className={`${styles.iconItem} ${active === item.id ? 'active' : ''}`}>
          {viewRender(item.icon)}
        </span>
      })}
    </div>
  </div>
}

export default ActivityBar;