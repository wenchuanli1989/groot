import { PropMetadataData, PropBlockLayout, PropBlockStructType, PropValueType, PropItemViewType, PropItemStruct, ValueStruct } from "@grootio/common";
import { EntityManager } from "@mikro-orm/core";

import { PropValue } from "../entities/PropValue";
import { Component } from "../entities/Component";
import { ComponentInstance } from "../entities/ComponentInstance";
import { ComponentVersion } from "../entities/ComponentVersion";
import { PropBlock } from "../entities/PropBlock";
import { PropGroup } from "../entities/PropGroup";
import { PropItem } from "../entities/PropItem";
import { Release } from "../entities/Release";
import { Solution } from "../entities/Solution";
import { SolutionInstance } from "../entities/SolutionInstance";
import { SolutionComponent } from "../entities/SolutionComponent";
import { View } from "../entities/View";
import { Project } from "../entities/Project";
import { Application } from "../entities/Application";

export const create = async (em: EntityManager, solution: Solution, release: Release, project: Project, app: Application) => {
  // 创建组件
  const avatarComponent = em.create(Component, {
    solution,
    name: '头像',
    packageName: 'antd',
    componentName: 'Avatar',
  });
  await em.persistAndFlush(avatarComponent);

  // 创建组件版本
  const avatarComponentVersion = em.create(ComponentVersion, {
    name: 'v0.0.1',
    component: avatarComponent,
    publish: true,
    solution
  });
  avatarComponent.recentVersion = avatarComponentVersion;
  await em.persistAndFlush(avatarComponentVersion);


  // 创建组件配置项
  const avatarGroup = em.create(PropGroup, {
    name: '常用配置',
    order: 1000,
    componentVersion: avatarComponentVersion,
    component: avatarComponentVersion,
    solution
  });
  await em.persistAndFlush(avatarGroup);

  const avatarBlock = em.create(PropBlock, {
    name: '基础功能',
    group: avatarGroup,
    componentVersion: avatarComponentVersion,
    order: 1000,
    component: avatarComponent,
    layout: PropBlockLayout.Horizontal,
    struct: PropBlockStructType.Default,
    solution
  })
  await em.persistAndFlush(avatarBlock);

  const avatarItem1 = em.create(PropItem, {
    label: '资源地址',
    propKey: 'src',
    viewType: PropItemViewType.Text,
    defaultValue: '"https://joeschmoe.io/api/v1/random"',
    block: avatarBlock,
    group: avatarGroup,
    componentVersion: avatarComponentVersion,
    order: 1000,
    component: avatarComponent,
    solution
  });

  const avatarItem2 = em.create(PropItem, {
    label: '形状',
    propKey: 'shape',
    viewType: PropItemViewType.ButtonGroup,
    defaultValue: '"circle"',
    valueOptions: '[{"label": "圆形","value": "circle"},{"label": "方形","value": "square"}]',
    block: avatarBlock,
    group: avatarGroup,
    componentVersion: avatarComponentVersion,
    order: 2000,
    component: avatarComponent,
    solution
  })
  await em.persistAndFlush([avatarItem1, avatarItem2]);


  const profileView = em.create(View, {
    name: '个人资料',
    key: '/layout/groot/profile',
    app,
    project,
    release
  })
  await em.persistAndFlush(profileView);

  // 创建入口解决方案实例
  const solutionInstance = em.create(SolutionInstance, {
    solution: solution,
    solutionVersion: solution.recentVersion,
    view: profileView,
    primary: true,
    release,
    project,
    app
  })
  await em.persistAndFlush(solutionInstance);

  // 创建组件
  const profileComponent = em.create(Component, {
    solution,
    name: '个人资料',
    packageName: 'app',
    componentName: 'Profile',
  });
  await em.persistAndFlush(profileComponent);

  // 创建组件版本
  const profileComponentVersion = em.create(ComponentVersion, {
    name: 'v0.0.1',
    component: profileComponent,
    publish: true,
    solution
  });
  profileComponent.recentVersion = profileComponentVersion;
  await em.persistAndFlush(profileComponentVersion);


  // 创建组件配置项
  const profileGroup = em.create(PropGroup, {
    name: '常用配置',
    order: 1000,
    componentVersion: profileComponentVersion,
    component: profileComponent,
    solution
  });
  await em.persistAndFlush(profileGroup);

  const profileBlock = em.create(PropBlock, {
    name: '基础功能',
    group: profileGroup,
    componentVersion: profileComponentVersion,
    order: 1000,
    component: profileComponent,
    layout: PropBlockLayout.Horizontal,
    struct: PropBlockStructType.Default,
    solution
  })
  await em.persistAndFlush(profileBlock);

  const profileItem1 = em.create(PropItem, {
    label: '姓名',
    propKey: 'name',
    viewType: PropItemViewType.Text,
    defaultValue: '"张三"',
    block: profileBlock,
    group: profileGroup,
    componentVersion: profileComponentVersion,
    order: 1000,
    component: profileComponent,
    solution
  });

  const profileItem2 = em.create(PropItem, {
    label: '地址',
    propKey: 'address',
    viewType: PropItemViewType.Text,
    defaultValue: '"上海"',
    block: profileBlock,
    group: profileGroup,
    componentVersion: profileComponentVersion,
    order: 2000,
    component: profileComponent,
    solution
  })

  const profileItem3 = em.create(PropItem, {
    label: '邮箱',
    propKey: 'email',
    viewType: PropItemViewType.Text,
    defaultValue: '"zhangsan@email.com"',
    block: profileBlock,
    group: profileGroup,
    componentVersion: profileComponentVersion,
    order: 3000,
    component: profileComponent,
    solution
  })

  const profileItem4 = em.create(PropItem, {
    label: '头像',
    propKey: 'avatar',
    struct: PropItemStruct.Component,
    block: profileBlock,
    group: profileGroup,
    componentVersion: profileComponentVersion,
    order: 4000,
    component: profileComponent,
    solution
  })
  await em.persistAndFlush([profileItem1, profileItem2, profileItem3, profileItem4]);

  const profileSolutionComponent = em.create(SolutionComponent, {
    solution,
    solutionVersion: solution.recentVersion,
    componentVersion: profileComponentVersion,
    component: profileComponent,
    view: false,
  })

  await em.persistAndFlush(profileSolutionComponent)

  const avatarSolutionComponent = em.create(SolutionComponent, {
    solution,
    solutionVersion: solution.recentVersion,
    componentVersion: avatarComponentVersion,
    component: avatarComponent,
    view: false,
    parent: profileSolutionComponent
  })

  await em.persistAndFlush(avatarSolutionComponent)

  // 创建组件实例
  const profileComponentInstance = em.create(ComponentInstance, {
    view: profileView,
    component: profileComponent,
    componentVersion: profileComponentVersion,
    release,
    trackId: 0,
    app,
    project,
    solutionInstance,
    solutionComponent: profileSolutionComponent,
    solution
  });
  await em.persistAndFlush(profileComponentInstance);

  profileComponentInstance.trackId = profileComponentInstance.id;
  await em.persistAndFlush(profileComponentInstance);


  // 更新组件实例关联解决方案实例
  profileComponentInstance.solutionInstance = solutionInstance
  await em.persistAndFlush(profileComponentInstance);

  // 创建组件实例
  const avatarComponentInstance = em.create(ComponentInstance, {
    view: profileView,
    component: avatarComponent,
    componentVersion: avatarComponentVersion,
    release,
    trackId: 0,
    app,
    project,
    solution,
    solutionInstance,
    solutionComponent: avatarSolutionComponent
  });
  await em.persistAndFlush(avatarComponentInstance);

  avatarComponentInstance.trackId = avatarComponentInstance.id;
  await em.persistAndFlush(avatarComponentInstance);

  // 更新组件实例关联解决方案实例
  avatarComponentInstance.solutionInstance = solutionInstance
  await em.persistAndFlush(avatarComponentInstance);

  avatarComponentInstance.parent = profileComponentInstance;

  await em.persistAndFlush(avatarComponentInstance);

  const avatarValue = {
    setting: {},
    list: [{
      instanceId: avatarComponentInstance.id,
      componentId: avatarComponent.id,
      componentName: avatarComponent.name,
      order: 1000
    }]
  } as PropMetadataData;

  const profileItem4Value = em.create(PropValue, {
    propItem: profileItem4,
    component: profileComponent,
    componentVersion: profileComponentVersion,
    componentInstance: profileComponentInstance,
    type: PropValueType.Instance,
    value: JSON.stringify(avatarValue),
    valueStruct: ValueStruct.ChildComponentList,
    app,
    project,
    solution
  });
  await em.persistAndFlush(profileItem4Value);
}