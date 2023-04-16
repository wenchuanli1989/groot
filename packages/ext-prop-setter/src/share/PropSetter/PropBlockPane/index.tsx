import { Button, Col, Form, Row, Space, Typography } from "antd";
import { VerticalAlignTopOutlined, DeleteOutlined, VerticalAlignBottomOutlined, EditOutlined } from '@ant-design/icons';
import { useState } from "react";

import { pick, PropBlock, PropBlockLayout, PropItem, PropItemStruct, PropValueType, useModel, ValueStruct, ViewElement, viewRender } from "@grootio/common";

import styles from './index.module.less';
import PropPersistModel from "../PropPersistModel";
import PropHandleModel from "../PropHandleModel";
import { grootManager, isPrototypeMode } from "context";
import { calcPropValueIdChain } from "util/index";

type PropType = {
  block: PropBlock,
  freezeSetting?: boolean,
  noWrapMode?: boolean
}

function PropBlockPane({ block, freezeSetting, noWrapMode }: PropType) {
  const propPersistModel = useModel(PropPersistModel);
  const propHandleModel = useModel(PropHandleModel);
  const [component] = grootManager.state.useStateByName('gs.component')
  const [form] = Form.useForm();
  const noSetting = !isPrototypeMode() || freezeSetting || block.group.parentItem?.noSetting;

  const [getInitValue] = useState(() => {
    // const cacheMap = new Map<PropItem, any>();

    return (propItem: PropItem) => {
      // const hitValue = cacheMap.get(propItem);
      // if (hitValue) {
      //   return hitValue;
      // }

      const valueIdChain = calcPropValueIdChain(propItem);
      const propValue = propItem.valueList.filter(value => {
        return value.type === (isPrototypeMode() ? PropValueType.Prototype : PropValueType.Instance)
      }).find(value => {
        // 空字符串和null不相等
        return value.abstractValueIdChain === valueIdChain || (!value.abstractValueIdChain && !valueIdChain)
      })

      const value = propValue?.value || propItem.defaultValue
      // cacheMap.set(propItem, value);
      return value;
    }
  })

  const renderItemSetting = (propItem: PropItem, itemIndex: number) => {

    const editPropItem = () => {
      propPersistModel.currSettingPropItem = pick(propItem, ['id', 'struct', 'viewType', 'propKey', 'rootPropKey', 'label', 'span', 'optionList']);
    }

    return (<Space size="small">

      <Typography.Link onClick={(e) => {
        e.preventDefault();
        editPropItem();
      }}>
        <EditOutlined />
      </Typography.Link>

      <Typography.Link onClick={(e) => {
        e.preventDefault();
        propPersistModel.delItem(propItem.id, block);
      }} >
        <DeleteOutlined />
      </Typography.Link>

      {
        itemIndex > 0 && (
          <Typography.Link onClick={(e) => {
            e.preventDefault();
            propPersistModel.movePropItem(block, itemIndex, true);
          }}>
            <VerticalAlignTopOutlined />
          </Typography.Link>
        )
      }

      {
        itemIndex < block.propItemList.length - 1 && (
          <Typography.Link onClick={(e) => {
            e.preventDefault();
            propPersistModel.movePropItem(block, itemIndex, false);
          }}>
            <VerticalAlignBottomOutlined />
          </Typography.Link>
        )
      }
    </Space>)
  }

  const renderItemLabel = (propItem: PropItem, itemIndex: number, action: boolean) => {

    if (action) {
      return <div className={`${styles.propItemHeader} `}>
        <div className={styles.propItemHeaderText}>
          {propItem.label}
          <i className="highlight" hidden={!propItem.highlight} />
        </div>
        <div className={styles.propItemHeaderActions}>
          {renderItemSetting(propItem, itemIndex)}
        </div>
      </div>

    } else {
      return <>
        {propItem.label}
        <i className="highlight" hidden={!propItem.highlight} />
      </>
    }

  }


  const updateValue = (changedValues: any) => {
    const updateKey = Object.keys(changedValues)[0];
    const propItem = block.propItemList.find(item => item.propKey === updateKey);
    const valueStruct = propItem.struct === PropItemStruct.Component ? ValueStruct.ChildComponentList : undefined;

    propPersistModel.updateValue({
      propItem,
      value: changedValues[updateKey],
      valueStruct
    }).then(() => {
      if (!isPrototypeMode() && valueStruct === ValueStruct.ChildComponentList) {
        grootManager.command.executeCommand('gc.makeDataToStage', 'all');
      } else {
        grootManager.command.executeCommand('gc.makeDataToStage', 'current');
      }
    })
  }


  // 避免切换组件实例时表单控件无法刷新的问题
  let formKey;
  if (isPrototypeMode()) {
    formKey = `componentId:${component.id}|versionId:${component.componentVersion.id}`
  } else {
    const instance = grootManager.state.getState('gs.componentInstance')
    formKey = `releaseId:${grootManager.state.getState('gs.release').id}|instanceId:${instance.id}`;
  }

  return <div className={noWrapMode ? styles.container : ''}>
    <Form form={form} key={formKey} layout={PropBlockLayoutKeyMap[block.layout] as any}
      labelAlign="left" colon={false} className={`${styles.propForm} ${styles.compact}`}
      onValuesChange={(changedValues) => { updateValue(changedValues); }}>
      <Row gutter={6}>
        {
          block.propItemList.map((item, index) => {
            return <Col span={block.layout === PropBlockLayout.Vertical ? item.span : 24} key={item.id}
              onMouseEnter={() => {
                propHandleModel.setPropPathChain(item.id);
              }}
              onMouseLeave={() => {
                propHandleModel.setPropPathChain();
              }}>
              {
                block.layout === PropBlockLayout.Vertical ? (
                  <div className={`${styles.propItemContainer} ${styles.vertical} ${noSetting ? '' : styles.hasAction}`}>
                    {propHandleModel.renderFormItem(item, {
                      label: renderItemLabel(item, index, true),
                      name: item.propKey,
                      preserve: false,
                      initialValue: getInitValue(item)
                    }, false)}
                  </div>
                ) : (
                  <div className={`${styles.propItemContainer} ${styles.horizontal} ${noSetting ? '' : styles.hasAction}`}>
                    <div className="content">
                      {propHandleModel.renderFormItem(item, {
                        label: renderItemLabel(item, index, false),
                        name: item.propKey,
                        preserve: false,
                        initialValue: getInitValue(item)
                      }, false)}
                    </div>
                    <div className="action">{renderItemSetting(item, index)}</div>
                  </div>
                )
              }

            </Col>
          })
        }
      </Row>
    </Form>
    {
      // 平铺模式添加子项按钮在底部
      (!noSetting && noWrapMode) ? (
        <Button type="primary" ghost block onClick={() => {
          propPersistModel.showPropItemSettinngForCreate(block)
        }}>
          添加配置项
        </Button>
      ) : null
    }
  </div>
}

const PropBlockLayoutKeyMap = {
  [PropBlockLayout.Horizontal]: 'horizontal',
  [PropBlockLayout.Vertical]: 'vertical',
}

export default PropBlockPane;