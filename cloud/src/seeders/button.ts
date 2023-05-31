import { PropBlockLayout, PropBlockStructType, PropItemViewType } from "@grootio/common";
import { EntityManager } from "@mikro-orm/core";

import { SolutionInstance } from "../entities/SolutionInstance";
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
import { InstanceResource } from "../entities/InstanceResource";
import { Project } from "../entities/Project";

export const create = async (em: EntityManager, solution: Solution, release: Release, project: Project) => {
  // 创建组件
  const btnComponent = em.create(Component, {
    name: '按钮',
    packageName: 'antd',
    componentName: 'Button',
  });
  await em.persistAndFlush(btnComponent);

  // 创建组件版本
  const btnComponentVersion = em.create(ComponentVersion, {
    name: 'v0.0.1',
    component: btnComponent,
    publish: true
  });
  btnComponent.recentVersion = btnComponentVersion;
  await em.persistAndFlush(btnComponentVersion);

  // 将组件和解决方案进行关联
  solution.recentVersion.componentVersionList.add(btnComponentVersion)
  await em.persistAndFlush(solution.recentVersion);

  // 创建组件配置项
  const btnGroup = em.create(PropGroup, {
    name: '常用配置',
    order: 1000,
    componentVersion: btnComponentVersion,
    component: btnComponent
  });
  await em.persistAndFlush(btnGroup);

  const btnBlock = em.create(PropBlock, {
    name: '基础功能',
    group: btnGroup,
    componentVersion: btnComponentVersion,
    order: 1000,
    component: btnComponent,
    layout: PropBlockLayout.Horizontal,
    struct: PropBlockStructType.Default
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
    component: btnComponent
  });

  const btnItem2 = em.create(PropItem, {
    label: '按钮类型',
    propKey: 'type',
    viewType: PropItemViewType.ButtonGroup,
    defaultValue: '"primary"',
    valueOptions: '[{"label": "主要","value": "primary"},{"label": "默认","value": "default"},{"label": "幽灵","value": "dashed"},{"label": "链接","value": "link"}]',
    block: btnBlock,
    group: btnGroup,
    componentVersion: btnComponentVersion,
    order: 2000,
    component: btnComponent
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
    component: btnComponent
  })

  await em.persistAndFlush([btnItem1, btnItem2, btnItem3]);

  // 创建组件实例
  const btnComponentInstance = em.create(ComponentInstance, {
    name: '按钮',
    key: '/groot/button',
    entry: true,
    component: btnComponent,
    componentVersion: btnComponentVersion,
    release,
    trackId: 0,
  });
  await em.persistAndFlush(btnComponentInstance);

  btnComponentInstance.trackId = btnComponentInstance.id;
  await em.persistAndFlush(btnComponentInstance);



  const resourceConfig = em.create(ResourceConfig, {
    name: 'aaa',
    value: 'http://groot-local.com:10000/workbench/resource-demo',
    type: 'www'
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

  const instanceResource = em.create(InstanceResource, {
    componentInstance: btnComponentInstance,
    release,
    name: 'demo2',
    value: '/demo2',
    namespace: 'dataSource',
    resourceConfig
    // imageResource: projectResource
  })
  await em.persistAndFlush(instanceResource)


  // 创建入口解决方案实例
  const solutionInstance = em.create(SolutionInstance, {
    solution,
    solutionVersion: solution.recentVersion,
    entry: btnComponentInstance,
    primary: true
  })
  await em.persistAndFlush(solutionInstance);

  // 更新组件实例关联解决方案实例
  btnComponentInstance.solutionInstance = solutionInstance
  await em.persistAndFlush(btnComponentInstance);
}