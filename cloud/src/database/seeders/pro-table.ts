import { PropBlockLayout, PropBlockStructType, PropItemStruct, PropItemViewType, PropValueType } from "@grootio/common";
import { EntityManager } from "@mikro-orm/core";
import { SolutionEntry } from "../../entities/SolutionEntry";
import { SolutionInstance } from "../../entities/SolutionInstance";

import { Component } from "../../entities/Component";
import { ComponentInstance } from "../../entities/ComponentInstance";
import { ComponentVersion } from "../../entities/ComponentVersion";
import { PropBlock } from "../../entities/PropBlock";
import { PropGroup } from "../../entities/PropGroup";
import { PropItem } from "../../entities/PropItem";
import { PropValue } from "../../entities/PropValue";
import { Release } from "../../entities/Release";
import { Solution } from "../../entities/Solution";

export const create = async (em: EntityManager, solution: Solution, release: Release) => {
  // 创建组件
  const tableComponent = em.create(Component, {
    name: '列表查询',
    packageName: '@ant-design/pro-table',
    componentName: 'ProTable',
  });
  await em.persistAndFlush(tableComponent);

  // 创建组件版本
  const tableComponentVersion = em.create(ComponentVersion, {
    name: 'v0.0.1',
    component: tableComponent,
    publish: true
  });
  await em.persistAndFlush(tableComponentVersion);
  tableComponent.recentVersion = tableComponentVersion;
  await em.persistAndFlush(tableComponent);

  // 将组件和解决方案进行关联
  solution.recentVersion.componentVersionList.add(tableComponentVersion)
  await em.persistAndFlush(solution.recentVersion);

  // 创建解决方案首选入口
  const solutionEntry = em.create(SolutionEntry, {
    name: tableComponent.name,
    solutionVersion: solution.recentVersion,
    componentVersion: tableComponentVersion
  })
  await em.persistAndFlush(solutionEntry);

  // 创建组件配置项
  const commonGroup = em.create(PropGroup, {
    name: '常用配置',
    order: 1000,
    componentVersion: tableComponentVersion,
    component: tableComponent
  });
  await em.persistAndFlush(commonGroup);

  const columnBlock = em.create(PropBlock, {
    name: '列配置',
    propKey: 'columns',
    order: 1000,
    struct: PropBlockStructType.List,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    group: commonGroup,
    layout: PropBlockLayout.Horizontal,
  });
  await em.persistAndFlush(columnBlock);

  const columnInnerItem = em.create(PropItem, {
    label: '子项模版配置',
    struct: PropItemStruct.Hierarchy,
    block: columnBlock,
    group: commonGroup,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    order: 1000
  })
  await em.persistAndFlush(columnInnerItem);

  const columnInnerGroup = em.create(PropGroup, {
    name: '内嵌分组',
    order: 1000,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    parentItem: columnInnerItem
  });
  await em.persistAndFlush(columnInnerGroup);

  columnInnerItem.childGroup = columnInnerGroup;
  await em.persistAndFlush(columnInnerItem);

  const columnInnerBlock = em.create(PropBlock, {
    name: '通用列配置',
    order: 1000,
    struct: PropBlockStructType.Default,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    group: columnInnerGroup,
    layout: PropBlockLayout.Horizontal,
  });
  await em.persistAndFlush(columnInnerBlock);


  const columnItem1 = em.create(PropItem, {
    label: '索引',
    propKey: 'dataIndex',
    viewType: PropItemViewType.Text,
    block: columnInnerBlock,
    group: columnInnerGroup,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    order: 1000
  })
  await em.persistAndFlush(columnItem1);

  const columnItem2 = em.create(PropItem, {
    label: '标题',
    propKey: 'title',
    viewType: PropItemViewType.Text,
    block: columnInnerBlock,
    group: columnInnerGroup,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    order: 2000
  })
  await em.persistAndFlush(columnItem2);

  const columnItem3 = em.create(PropItem, {
    label: '类型',
    propKey: 'valueType',
    viewType: PropItemViewType.Select,
    valueOptions: '[{"label": "文本","value": "text"},{"label": "日期","value": "date"},{"label": "下拉框","value": "select"}]',
    block: columnInnerBlock,
    group: columnInnerGroup,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    order: 2000
  })
  await em.persistAndFlush(columnItem2);

  columnBlock.listStructData = `[${columnItem1.id},${columnItem2.id},${columnItem3.id}]`;
  await em.persistAndFlush(columnBlock);

  await createValue(em, columnInnerItem, tableComponent, tableComponentVersion, [columnItem1, columnItem2, columnItem3]);


  ////////////////


  const requestBlock = em.create(PropBlock, {
    name: '其他配置',
    propKey: '',
    order: 2000,
    struct: PropBlockStructType.Default,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    group: commonGroup,
  });
  await em.persistAndFlush(requestBlock);

  const rowKeyItem = em.create(PropItem, {
    label: '唯一键',
    propKey: 'rowKey',
    viewType: PropItemViewType.Text,
    block: requestBlock,
    group: commonGroup,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    defaultValue: '"id"',
    order: 1000
  })
  await em.persistAndFlush(rowKeyItem);

  const requestItem = em.create(PropItem, {
    label: '接口',
    propKey: 'request',
    viewType: PropItemViewType.Function,
    block: requestBlock,
    group: commonGroup,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    order: 2000,
    defaultValue: `"
    _exportFn = async function requestData(params, sort, filter) {
      const res = await fetch('http://groot-local.com:10000/workbench/demo');
      const result = await res.json();
      return { data: result.data, success: true };
    }
    "`
  })
  await em.persistAndFlush(requestItem);

  ///////////////

  const tableComponentInstance = em.create(ComponentInstance, {
    name: '查询页',
    key: '/groot/table',
    entry: true,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    release,
    trackId: 0,
  });
  await em.persistAndFlush(tableComponentInstance);


  tableComponentInstance.trackId = tableComponentInstance.id;
  await em.persistAndFlush(tableComponentInstance);


  // 创建入口解决方案实例
  const solutionInstance = em.create(SolutionInstance, {
    solution,
    solutionVersion: solution.recentVersion,
    entry: tableComponentInstance,
    primary: true
  })
  await em.persistAndFlush(solutionInstance);

  // 更新组件实例关联解决方案实例
  tableComponentInstance.solutionInstance = solutionInstance
  await em.persistAndFlush(tableComponentInstance);

  await createValue(em, columnInnerItem, tableComponent, tableComponentVersion, [columnItem1, columnItem2, columnItem3], tableComponentInstance);

  const requestValue = em.create(PropValue, {
    propItem: requestItem,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    componentInstance: tableComponentInstance,
    type: PropValueType.Instance,
    value: `"
    _exportFn = async function requestData(params, sort, filter) {
      const res = await fetch('http://groot-local.com:10000/workbench/demo');
      const result = await res.json();
      return { data: result.data, success: true };
    }"`
  });

  const rowKeyValue = em.create(PropValue, {
    propItem: rowKeyItem,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    componentInstance: tableComponentInstance,
    type: PropValueType.Instance,
    value: '"id"'
  });

  await em.persistAndFlush([requestValue, rowKeyValue]);
}

async function createValue(em: EntityManager, columnInnerItem: PropItem,
  tableComponent: Component, tableComponentVersion: ComponentVersion,
  [columnItem1, columnItem2, columnItem3]: PropItem[], instance?: ComponentInstance) {

  const columnValue1 = em.create(PropValue, {
    propItem: columnInnerItem,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
  });

  const columnValue2 = em.create(PropValue, {
    propItem: columnInnerItem,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
  });

  const columnValue3 = em.create(PropValue, {
    propItem: columnInnerItem,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
  });

  const columnValue4 = em.create(PropValue, {
    propItem: columnInnerItem,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
  });
  await em.persistAndFlush([columnValue1, columnValue2, columnValue3, columnValue4]);

  const columnValue1Item1 = em.create(PropValue, {
    propItem: columnItem1,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue1.id}`,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
    value: '"id"'
  });

  const columnValue1Item2 = em.create(PropValue, {
    propItem: columnItem2,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue1.id}`,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
    value: '"ID"'
  });

  const columnValue1Item3 = em.create(PropValue, {
    propItem: columnItem3,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue1.id}`,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
    value: '"text"'
  });

  const columnValue2Item1 = em.create(PropValue, {
    propItem: columnItem1,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue2.id}`,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
    value: '"name"'
  });

  const columnValue2Item2 = em.create(PropValue, {
    propItem: columnItem2,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue2.id}`,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
    value: '"姓名"'
  });

  const columnValue2Item3 = em.create(PropValue, {
    propItem: columnItem3,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue2.id}`,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
    value: '"text"'
  });

  const columnValue3Item1 = em.create(PropValue, {
    propItem: columnItem1,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue3.id}`,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
    value: '"age"'
  });

  const columnValue3Item2 = em.create(PropValue, {
    propItem: columnItem2,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue3.id}`,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
    value: '"年龄"'
  });

  const columnValue3Item3 = em.create(PropValue, {
    propItem: columnItem3,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue3.id}`,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
    value: '"text"'
  });

  const columnValue4Item1 = em.create(PropValue, {
    propItem: columnItem1,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue4.id}`,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
    value: '"address"'
  });

  const columnValue4Item2 = em.create(PropValue, {
    propItem: columnItem2,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue4.id}`,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
    value: '"地址"'
  });

  const columnValue4Item3 = em.create(PropValue, {
    propItem: columnItem3,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue4.id}`,
    componentInstance: instance || undefined,
    type: instance ? PropValueType.Instance : PropValueType.Prototype,
    value: '"text"'
  });

  await em.persistAndFlush([
    columnValue1Item1, columnValue1Item2, columnValue1Item3,
    columnValue2Item1, columnValue2Item2, columnValue2Item3,
    columnValue3Item1, columnValue3Item2, columnValue3Item3,
    columnValue4Item1, columnValue4Item2, columnValue4Item3,
  ]);
}