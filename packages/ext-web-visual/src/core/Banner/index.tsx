import { ViewItem, viewRender } from "@grootio/common";
import { getContext, grootManager } from "context";

import styles from './index.module.less'

const Banner = () => {
  const { useStateByName } = grootManager.state
  const [viewMap] = useStateByName('gs.ui.viewMap');
  const [bannerViewMap] = useStateByName('gs.ui.banner.viewMap');

  const leftViewItemList: ViewItem[] = [];
  const centerViewItemList: ViewItem[] = [];
  const rightViewItemList: ViewItem[] = [];

  bannerViewMap.forEach((viewKey) => {
    const viewItem = viewMap.get(viewKey.id)
    if (!viewItem) {
      return
    }

    if (viewKey.placement === 'center') {
      centerViewItemList.push(viewItem)
    } else if (viewKey.placement === 'left') {
      leftViewItemList.push(viewItem)
    } else if (viewKey.placement === 'right') {
      rightViewItemList.push(viewItem)
    }
  })

  return <div className={styles.container} style={{ lineHeight: getContext().layout.bannerHeight }}>
    <div>
      {
        leftViewItemList.map((viewItem) => {
          return viewRender(viewItem.view, { key: viewItem.id })
        })
      }
    </div>

    <div className={styles.center}>
      {
        centerViewItemList.map((viewItem) => {
          return viewRender(viewItem.view, { key: viewItem.id })
        })
      }
    </div>

    <div>
      {
        rightViewItemList.map((viewItem) => {
          return viewRender(viewItem.view, { key: viewItem.id })
        })
      }
    </div>

  </div>
}

export default Banner;