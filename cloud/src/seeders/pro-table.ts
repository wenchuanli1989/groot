import { PropBlockLayout, PropBlockStructType, PropItemStruct, PropItemViewType, PropValueType } from "@grootio/common";
import { EntityManager } from "@mikro-orm/core";

import { SolutionInstance } from "../entities/SolutionInstance";
import { Component } from "../entities/Component";
import { ComponentInstance } from "../entities/ComponentInstance";
import { ComponentVersion } from "../entities/ComponentVersion";
import { PropBlock } from "../entities/PropBlock";
import { PropGroup } from "../entities/PropGroup";
import { PropItem } from "../entities/PropItem";
import { PropValue } from "../entities/PropValue";
import { Release } from "../entities/Release";
import { Solution } from "../entities/Solution";
import { SolutionComponent } from "../entities/SolutionComponent";
import { View } from "../entities/View";
import { Project } from "../entities/Project";
import { Application } from "../entities/Application";
import { ViewVersion } from "../entities/ViewVersion";
import { AppView } from "../entities/AppView";

export const create = async (em: EntityManager, solution: Solution, release: Release, project: Project, app: Application) => {
  // 创建组件
  const tableComponent = em.create(Component, {
    solution,
    name: '列表查询',
    packageName: '@ant-design/pro-table',
    componentName: 'ProTable',
  });
  await em.persistAndFlush(tableComponent);

  // 创建组件版本
  const tableComponentVersion = em.create(ComponentVersion, {
    name: 'v0.0.1',
    component: tableComponent,
    publish: true,
    solution
  });
  await em.persistAndFlush(tableComponentVersion);
  tableComponent.recentVersion = tableComponentVersion;
  await em.persistAndFlush(tableComponent);


  // 创建组件配置项
  const commonGroup = em.create(PropGroup, {
    name: '常用配置',
    order: 1000,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    solution
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
    solution
  });
  await em.persistAndFlush(columnBlock);

  const columnInnerItem = em.create(PropItem, {
    label: '子项模版配置',
    struct: PropItemStruct.Hierarchy,
    block: columnBlock,
    group: commonGroup,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    order: 1000,
    solution
  })
  await em.persistAndFlush(columnInnerItem);

  const columnInnerGroup = em.create(PropGroup, {
    name: '内嵌分组',
    order: 1000,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    parentItem: columnInnerItem,
    solution
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
    solution
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
    order: 1000,
    solution
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
    order: 2000,
    solution
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
    order: 2000,
    solution
  })
  await em.persistAndFlush(columnItem2);

  columnBlock.listStructData = `[${columnItem1.id},${columnItem2.id},${columnItem3.id}]`;
  await em.persistAndFlush(columnBlock);

  await createValue(em, columnInnerItem, tableComponent, tableComponentVersion, [columnItem1, columnItem2, columnItem3], { solution });


  ////////////////


  const requestBlock = em.create(PropBlock, {
    name: '其他配置',
    propKey: '',
    order: 2000,
    struct: PropBlockStructType.Default,
    componentVersion: tableComponentVersion,
    component: tableComponent,
    group: commonGroup,
    solution
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
    order: 1000,
    solution
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
    "`,
    solution
  })
  await em.persistAndFlush(requestItem);

  ///////////////

  const tableView = em.create(View, {
    name: '查询页',
    key: '/layout/groot/table',
    app,
    project,
  })
  await em.persistAndFlush(tableView);

  const tableViewVersion = em.create(ViewVersion, {
    name: 'v0.0.1',
    view: tableView,
    project,
    app
  })
  await em.persistAndFlush(tableViewVersion);

  const tableAppView = em.create(AppView, {
    release,
    view: tableView,
    viewVersion: tableViewVersion,
    app,
    project
  })
  await em.persistAndFlush(tableAppView);

  // 创建入口解决方案实例
  const solutionInstance = em.create(SolutionInstance, {
    solution: solution,
    solutionVersion: solution.recentVersion,
    view: tableView,
    viewVersion: tableViewVersion,
    primary: true,
    app,
    project
  })
  await em.persistAndFlush(solutionInstance);

  const solutionComponent = em.create(SolutionComponent, {
    solution,
    solutionVersion: solution.recentVersion,
    componentVersion: tableComponentVersion,
    component: tableComponent,
  })

  await em.persistAndFlush(solutionComponent)

  const tableComponentInstance = em.create(ComponentInstance, {
    view: tableView,
    viewVersion: tableViewVersion,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    trackId: 0,
    solution,
    project,
    app,
    solutionInstance,
    solutionComponent
  });
  await em.persistAndFlush(tableComponentInstance);


  tableComponentInstance.trackId = tableComponentInstance.id;
  await em.persistAndFlush(tableComponentInstance);




  // 更新组件实例关联解决方案实例
  tableComponentInstance.solutionInstance = solutionInstance
  await em.persistAndFlush(tableComponentInstance);

  await createValue(em, columnInnerItem, tableComponent, tableComponentVersion, [columnItem1, columnItem2, columnItem3], { instance: tableComponentInstance, project, app, viewVersion: tableViewVersion });

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
    }"`,
    app,
    project,
    solution,
    view: tableView,
    viewVersion: tableViewVersion
  });

  const rowKeyValue = em.create(PropValue, {
    propItem: rowKeyItem,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    componentInstance: tableComponentInstance,
    type: PropValueType.Instance,
    value: '"id"',
    app,
    project,
    solution,
    view: tableView,
    viewVersion: tableViewVersion
  });

  await em.persistAndFlush([requestValue, rowKeyValue]);
}

async function createValue(em: EntityManager, columnInnerItem: PropItem,
  tableComponent: Component, tableComponentVersion: ComponentVersion,
  [columnItem1, columnItem2, columnItem3]: PropItem[], params: { instance?: ComponentInstance, project?: Project, app?: Application, solution?: Solution, viewVersion?: ViewVersion }) {

  const columnValue1 = em.create(PropValue, {
    propItem: columnInnerItem,
    component: tableComponent,
    componentVersion: tableComponentVersion,
  });

  const columnValue2 = em.create(PropValue, {
    propItem: columnInnerItem,
    component: tableComponent,
    componentVersion: tableComponentVersion,
  });

  const columnValue3 = em.create(PropValue, {
    propItem: columnInnerItem,
    component: tableComponent,
    componentVersion: tableComponentVersion,
  });

  const columnValue4 = em.create(PropValue, {
    propItem: columnInnerItem,
    component: tableComponent,
    componentVersion: tableComponentVersion,
  });

  if (params.instance) {
    columnValue1.type = PropValueType.Instance;
    columnValue1.app = params.app;
    columnValue1.project = params.project
    columnValue1.componentInstance = params.instance
    columnValue1.solution = params.solution
    columnValue1.view = params.viewVersion.view
    columnValue1.viewVersion = params.viewVersion

    columnValue2.type = PropValueType.Instance;
    columnValue2.app = params.app;
    columnValue2.project = params.project
    columnValue2.componentInstance = params.instance
    columnValue2.solution = params.solution
    columnValue2.view = params.viewVersion.view
    columnValue2.viewVersion = params.viewVersion

    columnValue3.type = PropValueType.Instance;
    columnValue3.app = params.app;
    columnValue3.project = params.project
    columnValue3.componentInstance = params.instance
    columnValue3.solution = params.solution
    columnValue3.view = params.viewVersion.view
    columnValue3.viewVersion = params.viewVersion

    columnValue4.type = PropValueType.Instance;
    columnValue4.app = params.app;
    columnValue4.project = params.project
    columnValue4.componentInstance = params.instance
    columnValue4.solution = params.solution
    columnValue4.view = params.viewVersion.view
    columnValue4.viewVersion = params.viewVersion
  } else {
    columnValue1.type = PropValueType.Prototype;
    columnValue1.solution = params.solution

    columnValue2.type = PropValueType.Prototype;
    columnValue2.solution = params.solution

    columnValue3.type = PropValueType.Prototype;
    columnValue3.solution = params.solution

    columnValue4.type = PropValueType.Prototype;
    columnValue4.solution = params.solution
  }

  await em.persistAndFlush([columnValue1, columnValue2, columnValue3, columnValue4]);

  const columnValue1Item1 = em.create(PropValue, {
    propItem: columnItem1,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue1.id}`,
    value: '"id"'
  });

  const columnValue1Item2 = em.create(PropValue, {
    propItem: columnItem2,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue1.id}`,
    value: '"ID"'
  });

  const columnValue1Item3 = em.create(PropValue, {
    propItem: columnItem3,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue1.id}`,
    value: '"text"'
  });

  const columnValue2Item1 = em.create(PropValue, {
    propItem: columnItem1,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue2.id}`,
    value: '"name"'
  });

  const columnValue2Item2 = em.create(PropValue, {
    propItem: columnItem2,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue2.id}`,
    value: '"姓名"'
  });

  const columnValue2Item3 = em.create(PropValue, {
    propItem: columnItem3,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue2.id}`,
    value: '"text"'
  });

  const columnValue3Item1 = em.create(PropValue, {
    propItem: columnItem1,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue3.id}`,
    value: '"age"'
  });

  const columnValue3Item2 = em.create(PropValue, {
    propItem: columnItem2,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue3.id}`,
    value: '"年龄"'
  });

  const columnValue3Item3 = em.create(PropValue, {
    propItem: columnItem3,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue3.id}`,
    value: '"text"'
  });

  const columnValue4Item1 = em.create(PropValue, {
    propItem: columnItem1,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue4.id}`,
    value: '"address"'
  });

  const columnValue4Item2 = em.create(PropValue, {
    propItem: columnItem2,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue4.id}`,
    value: '"地址"'
  });

  const columnValue4Item3 = em.create(PropValue, {
    propItem: columnItem3,
    component: tableComponent,
    componentVersion: tableComponentVersion,
    abstractValueIdChain: `${columnValue4.id}`,
    value: '"text"'
  });

  if (params.instance) {

    columnValue1Item1.type = PropValueType.Instance;
    columnValue1Item1.app = params.app;
    columnValue1Item1.project = params.project
    columnValue1Item1.componentInstance = params.instance
    columnValue1Item1.solution = params.solution
    columnValue1Item1.view = params.viewVersion.view
    columnValue1Item1.viewVersion = params.viewVersion

    columnValue1Item2.type = PropValueType.Instance;
    columnValue1Item2.app = params.app;
    columnValue1Item2.project = params.project
    columnValue1Item2.componentInstance = params.instance
    columnValue1Item2.solution = params.solution
    columnValue1Item2.view = params.viewVersion.view
    columnValue1Item2.viewVersion = params.viewVersion

    columnValue1Item3.type = PropValueType.Instance;
    columnValue1Item3.app = params.app;
    columnValue1Item3.project = params.project
    columnValue1Item3.componentInstance = params.instance
    columnValue1Item3.solution = params.solution
    columnValue1Item3.view = params.viewVersion.view
    columnValue1Item3.viewVersion = params.viewVersion

    columnValue2Item1.type = PropValueType.Instance;
    columnValue2Item1.app = params.app;
    columnValue2Item1.project = params.project
    columnValue2Item1.componentInstance = params.instance
    columnValue2Item1.solution = params.solution
    columnValue2Item1.view = params.viewVersion.view
    columnValue2Item1.viewVersion = params.viewVersion

    columnValue2Item2.type = PropValueType.Instance;
    columnValue2Item2.app = params.app;
    columnValue2Item2.project = params.project
    columnValue2Item2.componentInstance = params.instance
    columnValue2Item2.solution = params.solution
    columnValue2Item2.view = params.viewVersion.view
    columnValue2Item2.viewVersion = params.viewVersion

    columnValue2Item3.type = PropValueType.Instance;
    columnValue2Item3.app = params.app;
    columnValue2Item3.project = params.project
    columnValue2Item3.componentInstance = params.instance
    columnValue2Item3.solution = params.solution
    columnValue2Item3.view = params.viewVersion.view
    columnValue2Item3.viewVersion = params.viewVersion

    columnValue3Item1.type = PropValueType.Instance;
    columnValue3Item1.app = params.app;
    columnValue3Item1.project = params.project
    columnValue3Item1.componentInstance = params.instance
    columnValue3Item1.solution = params.solution
    columnValue3Item1.view = params.viewVersion.view
    columnValue3Item1.viewVersion = params.viewVersion

    columnValue3Item2.type = PropValueType.Instance;
    columnValue3Item2.app = params.app;
    columnValue3Item2.project = params.project
    columnValue3Item2.componentInstance = params.instance
    columnValue3Item2.solution = params.solution
    columnValue3Item2.view = params.viewVersion.view
    columnValue3Item2.viewVersion = params.viewVersion

    columnValue3Item3.type = PropValueType.Instance;
    columnValue3Item3.app = params.app;
    columnValue3Item3.project = params.project
    columnValue3Item3.componentInstance = params.instance
    columnValue3Item3.solution = params.solution
    columnValue3Item3.view = params.viewVersion.view
    columnValue3Item3.viewVersion = params.viewVersion

    columnValue4Item1.type = PropValueType.Instance;
    columnValue4Item1.app = params.app;
    columnValue4Item1.project = params.project
    columnValue4Item1.componentInstance = params.instance
    columnValue4Item1.solution = params.solution
    columnValue4Item1.view = params.viewVersion.view
    columnValue4Item1.viewVersion = params.viewVersion

    columnValue4Item2.type = PropValueType.Instance;
    columnValue4Item2.app = params.app;
    columnValue4Item2.project = params.project
    columnValue4Item2.componentInstance = params.instance
    columnValue4Item2.solution = params.solution
    columnValue4Item2.view = params.viewVersion.view
    columnValue4Item2.viewVersion = params.viewVersion

    columnValue4Item3.type = PropValueType.Instance;
    columnValue4Item3.app = params.app;
    columnValue4Item3.project = params.project
    columnValue4Item3.componentInstance = params.instance
    columnValue4Item3.solution = params.solution
    columnValue4Item3.view = params.viewVersion.view
    columnValue4Item3.viewVersion = params.viewVersion

  } else {

    columnValue1Item1.type = PropValueType.Prototype;
    columnValue1Item1.solution = params.solution

    columnValue1Item2.type = PropValueType.Prototype;
    columnValue1Item2.solution = params.solution

    columnValue1Item3.type = PropValueType.Prototype;
    columnValue1Item3.solution = params.solution

    columnValue2Item1.type = PropValueType.Prototype;
    columnValue2Item1.solution = params.solution

    columnValue2Item2.type = PropValueType.Prototype;
    columnValue2Item2.solution = params.solution

    columnValue2Item3.type = PropValueType.Prototype;
    columnValue2Item3.solution = params.solution

    columnValue3Item1.type = PropValueType.Prototype;
    columnValue3Item1.solution = params.solution

    columnValue3Item2.type = PropValueType.Prototype;
    columnValue3Item2.solution = params.solution

    columnValue3Item3.type = PropValueType.Prototype;
    columnValue3Item3.solution = params.solution

    columnValue4Item1.type = PropValueType.Prototype;
    columnValue4Item1.solution = params.solution

    columnValue4Item2.type = PropValueType.Prototype;
    columnValue4Item2.solution = params.solution

    columnValue4Item3.type = PropValueType.Prototype;
    columnValue4Item3.solution = params.solution
  }

  await em.persistAndFlush([
    columnValue1Item1, columnValue1Item2, columnValue1Item3,
    columnValue2Item1, columnValue2Item2, columnValue2Item3,
    columnValue3Item1, columnValue3Item2, columnValue3Item3,
    columnValue4Item1, columnValue4Item2, columnValue4Item3,
  ]);
}