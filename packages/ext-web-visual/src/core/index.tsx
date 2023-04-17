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

  shareBootstrap();

  if (isPrototypeMode()) {
    prototypeBootstrap();
  } else {
    instanceBootstrap();
  }
}