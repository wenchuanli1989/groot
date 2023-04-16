import { Button, Collapse, Space, Typography } from "antd";
import { pick, PropBlock, PropBlockStructType, PropGroup, useModel } from "@grootio/common";
import { CaretRightOutlined, DeleteOutlined, EditOutlined, PlusOutlined, VerticalAlignBottomOutlined, VerticalAlignTopOutlined } from "@ant-design/icons";

import styles from './index.module.less';

import PropBlockPane from "../PropBlockPane";
import PropPersistModel from "../PropPersistModel";
import { isPrototypeMode } from "context";
import PropBlockListStructPane from "../PropBlockListStructPane";

type PropsType = {
  group: PropGroup,
}

const PropGroupPane: React.FC<PropsType> = ({ group }) => {
  const propPersistModel = useModel(PropPersistModel);
  const noSetting = !isPrototypeMode() || group.parentItem?.noSetting;

  const editBlock = (block: PropBlock) => {
    propPersistModel.currSettingPropBlock = pick(block, ['id', 'name', 'propKey', 'layout', 'rootPropKey', 'groupId', 'struct'])
  }

  const onChangeCollapse = (key: string | string[]) => {
    if (Array.isArray(key)) {
      group.expandBlockIdList = key.map(k => +k);
    } else {
      group.expandBlockIdList = [+key];
    }
  }

  const renderBlockSetting = (block: PropBlock, blockIndex: number) => {
    if (noSetting) return null;

    return (<Space size="small" >
      {
        block.struct !== PropBlockStructType.List && (
          <Typography.Link onClick={(e) => {
            e.stopPropagation();
            propPersistModel.showPropItemSettinngForCreate(block);
          }}>
            <PlusOutlined />
          </Typography.Link>
        )
      }

      <Typography.Link onClick={(e) => {
        e.stopPropagation();
        editBlock(block);
      }}>
        <EditOutlined />
      </Typography.Link>

      <Typography.Link onClick={(e) => {
        e.stopPropagation();
        propPersistModel.delBlock(block.id, group);
      }} >
        <DeleteOutlined />
      </Typography.Link>

      {
        blockIndex > 0 && (
          <Typography.Link onClick={(e) => {
            e.stopPropagation();
            propPersistModel.movePropBlock(group, blockIndex, true);
          }}>
            <VerticalAlignTopOutlined />
          </Typography.Link>
        )
      }

      {
        blockIndex < group.propBlockList.length - 1 && (
          <Typography.Link onClick={(e) => {
            e.stopPropagation();
            propPersistModel.movePropBlock(group, blockIndex, false);
          }}>
            <VerticalAlignBottomOutlined />
          </Typography.Link>
        )
      }
    </Space>)
  }


  return (<div className={styles.container}>
    <Collapse activeKey={group.expandBlockIdList} onChange={onChangeCollapse} bordered={false}
      expandIconPosition="end" expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}>
      {
        group.propBlockList.map((block, blockIndex) => {
          return (<Collapse.Panel key={block.id} extra={renderBlockSetting(block, blockIndex)}
            header={<>
              {block.name}<i className="highlight" hidden={!block.highlight} />
            </>} >
            {
              block.struct === PropBlockStructType.Default ?
                (<PropBlockPane block={block} />)
                :
                (<PropBlockListStructPane block={block} />)
            }

          </Collapse.Panel>)
        })
      }
    </Collapse>
    <div className={styles.footerAction}>
      {
        !noSetting && (
          <Button type="primary" ghost block onClick={() => {
            propPersistModel.showPropBlockSettinngForCreate(group);
          }}>
            添加配置块
          </Button>
        )
      }
    </div>

  </div>)
};

export default PropGroupPane;