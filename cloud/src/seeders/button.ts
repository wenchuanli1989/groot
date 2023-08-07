import { PropBlockLayout, PropBlockStructType, PropItemViewType } from "@grootio/common";
import { EntityManager } from "@mikro-orm/core";

import { Component } from "../entities/Component";
import { ComponentInstance } from "../entities/ComponentInstance";
import { ComponentVersion } from "../entities/ComponentVersion";
import { PropBlock } from "../entities/PropBlock";
import { PropGroup } from "../entities/PropGroup";
import { PropItem } from "../entities/PropItem";
import { Release } from "../entities/Release";
import { Solution } from "../entities/Solution";
import { ResourceConfig } from "../entities/ResourceConfig";
import { ProjectResource } from "../entities/ProjectResource";
import { ViewResource } from "../entities/ViewResource";
import { Project } from "../entities/Project";
import { SolutionComponent } from "../entities/SolutionComponent";
import { View } from "../entities/View";
import { Application } from "../entities/Application";
import { SolutionInstance } from "../entities/SolutionInstance";
import { ViewVersion } from "../entities/ViewVersion";
import { AppView } from "../entities/AppView";
import { LargeText } from "../entities/LargeText";

export const create = async (em: EntityManager, solution: Solution, release: Release, project: Project, app: Application) => {
  // 创建组件
  const btnComponent = em.create(Component, {
    solution,
    name: '按钮',
    packageName: 'antd',
    componentName: 'Button',
  });
  await em.persistAndFlush(btnComponent);

  // 创建组件版本
  const btnComponentVersion = em.create(ComponentVersion, {
    solution,
    name: 'v0.0.1',
    component: btnComponent,
    publish: true
  });
  btnComponent.recentVersion = btnComponentVersion;
  await em.persistAndFlush(btnComponentVersion);


  // 创建组件配置项
  const btnGroup = em.create(PropGroup, {
    name: '常用配置',
    order: 1000,
    componentVersion: btnComponentVersion,
    component: btnComponent,
    solution
  });
  await em.persistAndFlush(btnGroup);

  const btnBlock = em.create(PropBlock, {
    name: '基础功能',
    group: btnGroup,
    componentVersion: btnComponentVersion,
    order: 1000,
    component: btnComponent,
    layout: PropBlockLayout.Horizontal,
    struct: PropBlockStructType.Default,
    solution
  })
  await em.persistAndFlush(btnBlock);

  const btnItem1 = em.create(PropItem, {
    label: '按钮文本',
    propKey: 'children',
    viewType: PropItemViewType.Text,
    defaultValue: '"hello"',
    block: btnBlock,
    group: btnGroup,
    componentVersion: btnComponentVersion,
    order: 1000,
    component: btnComponent,
    solution
  });

  const extraData1 = em.create(LargeText, {
    text: '{"optionList": [{"label": "主要","value": "primary"},{"label": "默认","value": "default"},{"label": "幽灵","value": "dashed"},{"label": "链接","value": "link"}]}'
  })
  await em.persistAndFlush(extraData1)

  const btnItem2 = em.create(PropItem, {
    label: '按钮类型',
    propKey: 'type',
    viewType: PropItemViewType.ButtonGroup,
    defaultValue: '"primary"',
    extraData: extraData1,
    block: btnBlock,
    group: btnGroup,
    componentVersion: btnComponentVersion,
    order: 2000,
    component: btnComponent,
    solution
  })

  const btnItem3 = em.create(PropItem, {
    label: '点击事件',
    propKey: 'onClick',
    viewType: PropItemViewType.Function,
    defaultValue: `"_exportFn = () => alert(_props.children)"`,
    block: btnBlock,
    group: btnGroup,
    componentVersion: btnComponentVersion,
    order: 3000,
    component: btnComponent,
    solution
  })

  await em.persistAndFlush([btnItem1, btnItem2, btnItem3]);

  const btnView = em.create(View, {
    name: '按钮',
    key: '/layout/groot/button',
    app,
    project,
  })
  await em.persistAndFlush(btnView);

  const btnViewVersion = em.create(ViewVersion, {
    name: 'v0.0.1',
    view: btnView,
    app,
    project,
  })
  await em.persistAndFlush(btnViewVersion);

  const btnAppView = em.create(AppView, {
    release,
    view: btnView,
    viewVersion: btnViewVersion,
    app,
    project
  })
  await em.persistAndFlush(btnAppView);

  const solutionComponent = em.create(SolutionComponent, {
    solution,
    solutionVersion: solution.recentVersion,
    componentVersion: btnComponentVersion,
    component: btnComponent,
    view: false,
  })

  await em.persistAndFlush(solutionComponent)

  // 创建入口解决方案实例
  const solutionInstance = em.create(SolutionInstance, {
    solution: solution,
    solutionVersion: solution.recentVersion,
    view: btnView,
    viewVersion: btnViewVersion,
    primary: true,
    app,
    project
  })
  await em.persistAndFlush(solutionInstance);

  // 创建组件实例
  const btnComponentInstance = em.create(ComponentInstance, {
    component: btnComponent,
    componentVersion: btnComponentVersion,
    trackId: 0,
    view: btnView,
    viewVersion: btnViewVersion,
    app,
    project,
    solution,
    solutionInstance,
    solutionComponent
  });
  await em.persistAndFlush(btnComponentInstance);

  btnComponentInstance.trackId = btnComponentInstance.id;
  await em.persistAndFlush(btnComponentInstance);

  const resourceConfigValue = em.create(LargeText, {
    text: 'http://groot-local.com:10000/workbench/resource-demo'
  })

  await em.persistAndFlush(resourceConfigValue)

  const resourceConfig = em.create(ResourceConfig, {
    name: 'aaa',
    value: resourceConfigValue,
    type: 'www',
    project
  })

  await em.persistAndFlush(resourceConfig)

  const projectResource = em.create(ProjectResource, {
    project,
    name: 'remark',
    value: '凄凄切切群',
    namespace: 'state',
    resourceConfig
  })

  await em.persistAndFlush(projectResource)

  const viewResource = em.create(ViewResource, {
    view: btnView,
    viewVersion: btnViewVersion,
    name: 'demo2',
    value: '/demo2',
    namespace: 'dataSource',
    resourceConfig,
    app,
    project,
    // imageResource: projectResource
  })
  await em.persistAndFlush(viewResource)

}