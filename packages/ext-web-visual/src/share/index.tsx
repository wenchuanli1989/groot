import { getContext, grootManager, isPrototypeMode } from "context";
import ToolBar from "./ToolBar";


export const shareBootstrap = () => {
  const { layout, groot } = getContext();
  const { getState, setState } = grootManager.state

  layout.design('visible', 'secondarySidebar', true);
  layout.design('visible', 'panel', false);
  layout.design('banner', 'center', null)

  const toolBarView = {
    id: 'toolBar',
    name: '工具栏',
    view: <ToolBar />,
  }

  groot.onReady(() => {
    getState('gs.ui.viewMap').set(toolBarView.id, toolBarView)

    setState('gs.ui.secondarySidebar.active', 'propSetter');
    setState('gs.ui.stage.active', 'workArea');

    getState('gs.ui.banner.viewMap').set('toolBar', { id: 'toolBar', placement: 'center' })
  })
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