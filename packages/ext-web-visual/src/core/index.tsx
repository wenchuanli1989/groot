import { grootManager, isPrototypeMode } from "context";
import { instanceBootstrap } from "instance";
import { prototypeBootstrap } from "prototype";
import { shareBootstrap } from "share";
import ActivityBar from "./ActivityBar";
import Banner from "./Banner";
import Panel from "./Panel";
import PrimarySidebar from "./PrimarySidebar";
import SecondarySidebar from "./SecondarySidebar";
import Stage from "./Stage";
import StatusBar from "./StatusBar";
import { ApplicationData, PostMessageType, ViewData } from "@grootio/common";

export const startup = () => {
  const { registerCommand } = grootManager.command

  registerCommand('gc.ui.render.banner', () => {
    return <Banner />
  });
  registerCommand('gc.ui.render.activityBar', () => {
    return <ActivityBar />
  });
  registerCommand('gc.ui.render.primarySidebar', () => {
    return <PrimarySidebar />
  });
  registerCommand('gc.ui.render.secondarySidebar', () => {
    return <SecondarySidebar />
  });
  registerCommand('gc.ui.render.stage', () => {
    return <Stage />
  });
  registerCommand('gc.ui.render.panel', () => {
    return <Panel />
  });
  registerCommand('gc.ui.render.statusBar', () => {
    return <StatusBar />
  });

  grootManager.hook.registerHook(PostMessageType.InnerFetchApplication, () => {
    const appData = buildApplicationData()
    // 提供hook调用方式方便第三方监控或日志
    grootManager.hook.callHook(PostMessageType.OuterSetApplication, appData)
  })

  shareBootstrap();

  if (isPrototypeMode()) {
    prototypeBootstrap();
  } else {
    instanceBootstrap();
  }
}


const buildApplicationData = () => {
  const playgroundPath = grootManager.state.getState('gs.stage.playgroundPath')

  if (isPrototypeMode()) {
    return {
      name: '原型',
      key: 'prototype-demo',
      viewList: [{ key: playgroundPath }],
      resourceList: [],
      resourceTaskList: [],
      resourceConfigList: []
    } as ApplicationData
  } else {
    const viewList = grootManager.state.getState('gs.viewList').map(item => {
      return {
        key: item.key,
        primaryView: item.primaryView
      } as ViewData
    })
    const { resourceList, resourceTaskList, resourceConfigList } = grootManager.command.executeCommand('gc.createResource')

    const appData: ApplicationData = {
      name: '实例',
      key: 'instance-demo',
      viewList,
      resourceTaskList,
      resourceList,
      resourceConfigList
    }

    return appData
  }
}

