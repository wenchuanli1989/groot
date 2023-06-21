import { PropGroup, PropGroupStructType, useModel } from "@grootio/common";
import { PlusOutlined } from '@ant-design/icons';
import { Tabs, Typography } from "antd";

import PropGroupPane from "../PropGroupPane";
import PropBlockPane from "../PropBlockPane";
import PropGroupToolBar from "../PropGroupToolBar";
import { grootManager, isPrototypeMode } from "context";
import PropHandleModel from "../PropHandleModel";
import PropPersistModel from "../PropPersistModel";
import { autoIncrementForName } from "util/index";

import styles from './index.module.less'

function PropPane() {
  const propHandleModel = useModel(PropHandleModel);
  const propPersistModel = useModel(PropPersistModel);
  const [activeGroupId] = grootManager.state.useStateByName('gs.activePropGroupId')
  const [propTree] = grootManager.state.useStateByName('gs.propTree')

  const renderTabBarItem = (group: PropGroup) => {
    return <div>{group.name}<i className="highlight" hidden={!group.highlight} /></div>;
  }

  // tab点击切换事件
  const tabOnChange = (activeKey: string) => {
    if (activeKey !== '__add') {
      // 选中某个分组
      propHandleModel.switchActiveGroup(parseInt(activeKey));
      return;
    }

    const nameSuffix = autoIncrementForName(propTree.map(g => g.name));
    // 显示分组弹框
    propPersistModel.currSettingPropGroup = {
      name: `配置组${nameSuffix}`,
    } as PropGroup;
  }

  const createTabItems = () => {

    const list = propTree.map((group) => {
      let content = <PropGroupPane group={group} key={`group-${group.id}-${propHandleModel.forceUpdateFormKey}`} />;
      if (group.struct === PropGroupStructType.Flat) {
        content = <PropBlockPane noWrapMode block={group.propBlockList[0]} key={`block-${group.propBlockList[0].id}-${propHandleModel.forceUpdateFormKey}`} />;
      }

      return { key: `${group.id}`, label: renderTabBarItem(group), children: content };
    })

    if (isPrototypeMode()) {
      list.push({
        key: '__add',
        label: <Typography.Link style={{ display: 'inline-block', width: '40px' }}><PlusOutlined /></Typography.Link>,
      } as any)
    }

    return list;
  }

  /////////////////////////////////////////////////////////////////////////////
  return <div className={styles.container}>
    <Tabs size="small" activeKey={activeGroupId?.toString()}
      onChange={tabOnChange} tabBarExtraContent={<PropGroupToolBar />} items={createTabItems() as any} />
  </div>
}


export default PropPane;