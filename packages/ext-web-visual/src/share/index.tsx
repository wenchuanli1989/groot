import { getContext, grootManager, isPrototypeMode } from "context";
import ToolBar from "./ToolBar";


export const shareBootstrap = () => {
  const { layout } = getContext();
  const { registerState } = grootManager.state

  registerState('gs.ui.views', [
    {
      id: 'toolBar',
      name: '工具栏',
      view: <ToolBar />,
    }
  ], true)

  registerState('gs.ui.viewsContainers', [], true)

  registerState('gs.ui.secondarySidebar.active', 'propSetter', false);
  registerState('gs.ui.stage.active', 'workArea', false);
  registerState('gs.ui.banner.views', [
    { id: 'toolBar', placement: 'center' }
  ], true)

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
    const componentInstance = grootManager.state.getState('gs.componentInstance');
    componentVersionId = componentInstance.componentVersion.id;
  }

  return componentVersionId;
}