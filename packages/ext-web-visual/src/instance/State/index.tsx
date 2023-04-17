import { Popover, Typography } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useRegisterModel } from "@grootio/common";

import styles from './index.module.less';
import StateModel from "./StateModel";
import StateForm from "./StateForm";
import { grootManager } from "context";

const StateList = () => {
  const stateModel = useRegisterModel(StateModel);
  const [globalStateList] = grootManager.state.useStateByName('gs.globalStateList')
  const [localSttateList] = grootManager.state.useStateByName('gs.localStateList')

  return <div className={styles.container}>
    {
      [
        {
          title: '全局',
          key: 'global',
          list: globalStateList
        }, {
          title: '页面',
          key: 'page',
          list: localSttateList
        }
      ].map((data) => {
        return <div className={styles.groupContainer} key={data.key}>
          <div className={styles.groupBar}>
            <div className={styles.groupTitle}>{data.title}</div>

            <Popover overlayClassName={styles.popoverOverlay} content={<StateForm />} trigger={['click']} placement="rightTop"
              open={stateModel.formVisible && !stateModel.currState && (data.key === 'global' ? stateModel.isGlobalState : !stateModel.isGlobalState)} >
              <Typography.Link className={styles.groupAction} disabled={stateModel.formVisible} onClick={() => {
                stateModel.showForm(data.key === 'global');
              }} >
                <PlusOutlined />
              </Typography.Link>
            </Popover>
          </div>

          <div className={styles.itemContainer}>
            {data.list.map(item => {
              return <div className={styles.item} key={item.id}>
                <div className={styles.itemTitle}>{item.name}</div>

                <Popover overlayClassName={styles.popoverOverlay} content={<StateForm />} trigger={['click']} open={stateModel.formVisible && stateModel.currState?.id === item.id} placement="rightTop">
                  <Typography.Link className={styles.itemAction} hidden={item.isReadonly} disabled={stateModel.formVisible} onClick={() => {
                    stateModel.showForm(!item.instanceId, item)
                  }} >
                    <EditOutlined />
                  </Typography.Link>
                </Popover>
              </div>
            })}
          </div>
        </div>
      })
    }
  </div>

}

export default StateList;