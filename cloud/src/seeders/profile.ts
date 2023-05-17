import { PropMetadataComponent, PropBlockLayout, PropBlockStructType, PropValueType, PropItemViewType, PropItemStruct } from "@grootio/common";
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
import { SolutionEntry } from "../entities/SolutionEntry";

export const create = async (em: EntityManager, solution: Solution, release: Release) => {
  // 创建组件
  const avatarComponent = em.create(Component, {
    name: '头像',
    packageName: 'antd',
    componentName: 'Avatar',
  });
  await em.persistAndFlush(avatarComponent);

  // 创建组件版本
  const avatarComponentVersion = em.create(ComponentVersion, {
    name: 'v0.0.1',
    component: avatarComponent,
    publish: true
  });
  avatarComponent.recentVersion = avatarComponentVersion;
  await em.persistAndFlush(avatarComponentVersion);

  // 将组件和解决方案进行关联
  solution.recentVersion.componentVersionList.add(avatarComponentVersion)
  await em.persistAndFlush(solution.recentVersion);

  // 创建组件配置项
  const avatarGroup = em.create(PropGroup, {
    name: '常用配置',
    order: 1000,
    componentVersion: avatarComponentVersion,
    component: avatarComponentVersion
  });
  await em.persistAndFlush(avatarGroup);

  const avatarBlock = em.create(PropBlock, {
    name: '基础功能',
    group: avatarGroup,
    componentVersion: avatarComponentVersion,
    order: 1000,
    component: avatarComponent,
    layout: PropBlockLayout.Horizontal,
    struct: PropBlockStructType.Default
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
    component: avatarComponent
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
    component: avatarComponent
  })
  await em.persistAndFlush([avatarItem1, avatarItem2]);


  // 创建组件实例
  const avatarComponentInstance = em.create(ComponentInstance, {
    name: '头像',
    component: avatarComponent,
    componentVersion: avatarComponentVersion,
    release,
    trackId: 0
  });
  await em.persistAndFlush(avatarComponentInstance);

  avatarComponentInstance.trackId = avatarComponentInstance.id;
  await em.persistAndFlush(avatarComponentInstance);







  // 创建组件
  const profileComponent = em.create(Component, {
    name: '个人资料',
    packageName: 'app',
    componentName: 'Profile',
  });
  await em.persistAndFlush(profileComponent);

  // 创建组件版本
  const profileComponentVersion = em.create(ComponentVersion, {
    name: 'v0.0.1',
    component: profileComponent,
    publish: true
  });
  profileComponent.recentVersion = profileComponentVersion;
  await em.persistAndFlush(profileComponentVersion);

  // 将组件和解决方案进行关联
  solution.recentVersion.componentVersionList.add(profileComponentVersion)
  await em.persistAndFlush(solution.recentVersion);

  // 创建解决方案首选入口
  const solutionEntry = em.create(SolutionEntry, {
    name: profileComponent.name,
    solutionVersion: solution.recentVersion,
    componentVersion: profileComponentVersion
  })
  await em.persistAndFlush(solutionEntry);

  // 创建组件配置项
  const profileGroup = em.create(PropGroup, {
    name: '常用配置',
    order: 1000,
    componentVersion: profileComponentVersion,
    component: profileComponent
  });
  await em.persistAndFlush(profileGroup);

  const profileBlock = em.create(PropBlock, {
    name: '基础功能',
    group: profileGroup,
    componentVersion: profileComponentVersion,
    order: 1000,
    component: profileComponent,
    layout: PropBlockLayout.Horizontal,
    struct: PropBlockStructType.Default
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
    component: profileComponent
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
    component: profileComponent
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
    component: profileComponent
  })

  const profileItem4 = em.create(PropItem, {
    label: '头像',
    propKey: 'avatar',
    struct: PropItemStruct.Component,
    block: profileBlock,
    group: profileGroup,
    componentVersion: profileComponentVersion,
    order: 4000,
    component: profileComponent
  })
  await em.persistAndFlush([profileItem1, profileItem2, profileItem3, profileItem4]);

  // 创建组件实例
  const profileComponentInstance = em.create(ComponentInstance, {
    name: '个人资料',
    key: '/groot/profile',
    entry: true,
    component: profileComponent,
    componentVersion: profileComponentVersion,
    release,
    trackId: 0,
  });
  await em.persistAndFlush(profileComponentInstance);

  profileComponentInstance.trackId = profileComponentInstance.id;
  await em.persistAndFlush(profileComponentInstance);


  // 创建入口解决方案实例
  const solutionInstance = em.create(SolutionInstance, {
    solution,
    solutionVersion: solution.recentVersion,
    entry: profileComponentInstance,
    primary: true
  })
  await em.persistAndFlush(solutionInstance);

  // 更新组件实例关联解决方案实例
  profileComponentInstance.solutionInstance = solutionInstance
  await em.persistAndFlush(profileComponentInstance);

  // 更新组件实例关联解决方案实例
  avatarComponentInstance.solutionInstance = solutionInstance
  await em.persistAndFlush(avatarComponentInstance);

  avatarComponentInstance.parent = profileComponentInstance;
  avatarComponentInstance.root = profileComponentInstance;

  await em.persistAndFlush(avatarComponentInstance);

  const avatarValue = {
    setting: {},
    list: [{
      instanceId: avatarComponentInstance.id,
      componentId: avatarComponent.id,
      componentName: avatarComponent.name,
      order: 1000
    }]
  } as PropMetadataComponent;

  const profileItem4Value = em.create(PropValue, {
    propItem: profileItem4,
    component: profileComponent,
    componentVersion: profileComponentVersion,
    componentInstance: profileComponentInstance,
    type: PropValueType.Instance,
    value: JSON.stringify(avatarValue)
  });
  await em.persistAndFlush(profileItem4Value);
}