import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { pick, PropGroup, useModel } from "@grootio/common";


import styles from './index.module.less';
import PropPersistModel from "../PropPersistModel";
import PropHandleModel from "../PropHandleModel";
import { grootManager, isPrototypeMode } from "context";

const PropGroupToolBar: React.FC = () => {
  const propPersistModel = useModel(PropPersistModel);
  const propHandleModel = useModel(PropHandleModel);
  const [activeGroupId] = grootManager.state.useStateByName('gs.activePropGroupId')
  const [propTree] = grootManager.state.useStateByName('gs.propTree')

  const [group, setGroup] = useState<PropGroup>();

  useEffect(() => {
    const group = propHandleModel.getPropGroup(activeGroupId);
    setGroup(group);
  }, [activeGroupId]);

  if (!isPrototypeMode() || !group) {
    return null;
  }

  return <div className={styles.container}>
    <Space >

      <Typography.Link onClick={() => {
        propPersistModel.currSettingPropGroup = pick(group, ['id', 'name', 'propKey', 'struct']);
      }}>
        <EditOutlined />
      </Typography.Link>

      <Typography.Link disabled={propTree.length === 1} onClick={() => {
        propPersistModel.delGroup(group.id);
      }}>
        <DeleteOutlined />
      </Typography.Link>
    </Space>
  </div>
}

export default PropGroupToolBar;