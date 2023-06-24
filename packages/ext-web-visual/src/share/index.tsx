import { getContext, grootManager, isPrototypeMode } from "context";
import ToolBar from "./ToolBar";


export const shareBootstrap = () => {
  const { layout } = getContext();
  const { registerState } = grootManager.state

  registerState('gs.ui.viewMap', new Map([
    ['toolBar', {
      id: 'toolBar',
      name: '工具栏',
      view: <ToolBar />,
    }]
  ]), false)

  registerState('gs.ui.viewContainerMap', new Map(), false)

  registerState('gs.ui.secondarySidebar.active', 'propSetter', false);
  registerState('gs.ui.stage.active', 'workArea', false);
  const bannerViewMap = new Map()
  bannerViewMap.set('toolBar', { id: 'toolBar', placement: 'center' })
  registerState('gs.ui.banner.viewMap', bannerViewMap, false)

  layout.design('visible', 'secondarySidebar', true);
  layout.design('visible', 'panel', false);
  layout.design('banner', 'center', null)

}


export const getComponentVersionId = () => {
  const component = grootManager.state.getState('gs.component');

  let componentVersionId;
  if (isPrototypeMode()) {
    componentVersionId = component.componentVersion.id;
  } else {
    const componentInstance = grootManager.state.getState('gs.activeComponentInstance');
    componentVersionId = componentInstance.componentVersion.id;
  }

  return componentVersionId;
}