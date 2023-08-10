import { HomeOutlined } from "@ant-design/icons";
import { PostMessageType } from "@grootio/common";
import { Breadcrumb } from "antd";
import { grootManager } from "context";

import styles from './index.module.less'

export const Navigation = () => {
  const { useStateByName } = grootManager.state
  const { callHook } = grootManager.hook
  const { executeCommand } = grootManager.command

  const [breadcrumbList] = useStateByName('gs.propSetter.breadcrumbList', []);

  return <div className={styles.container}>
    <Breadcrumb separator=">" items={
      breadcrumbList.map((item, index) => {
        return {
          title: <span onClick={() => {
            if (index === breadcrumbList.length - 1) {
              return;
            } else if (index > 0) {
              callHook(PostMessageType.OuterComponentSelect, item.id)
            } else {
              // 根组件不需要选择效果，直接切换，并清空标记
              executeCommand('gc.switchIstance', item.id)
              callHook(PostMessageType.OuterOutlineReset)
            }
          }}>
            {
              index === 0 ? (<HomeOutlined />) : item.name
            }
          </span>
        }
      })
    } />
  </div>
}

