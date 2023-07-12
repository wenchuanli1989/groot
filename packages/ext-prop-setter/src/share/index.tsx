import { commandBridge, getContext, grootManager, isPrototypeMode } from "context";
import { PropSetter } from "./PropSetter";
import FormRender from './FormRender'
import { ViewsContainer } from "@grootio/common";


export const shareBootstrap = () => {
  const { groot } = getContext();
  const { registerState, getState } = grootManager.state
  const { registerCommand } = grootManager.command

  const propSetterViewContainer = {
    id: 'propSetter',
    name: '属性设置器',
    view: () => {
      return <ViewsContainer context={propSetterViewContainer} groot={groot} />
    },
  }
  getState('gs.ui.viewContainerMap').set(propSetterViewContainer.id, propSetterViewContainer)

  const propSetterView = {
    id: 'propSetter',
    name: '属性设置器',
    view: <PropSetter />,
    parent: 'propSetter'
  }
  getState('gs.ui.viewMap').set(propSetterView.id, propSetterView)

  registerState('gs.propItem.formRenderList', [{ viewType: '*', render: FormRender }], true)

  registerState('gs.propItem.viewTypeMap', new Map([
    ['text', { label: '文本' }],
    ['textarea', { label: '多行文本' }],
    ['number', { label: '数字' }],
    ['slider', { label: '滑块' }],
    ['buttonGroup', { label: '按钮组' }],
    ['switch', { label: '开关' }],
    ['select', { label: '下拉框' }],
    ['checkbox', { label: '多选' }],
    ['radio', { label: '单选' }],
    ['datePicker', { label: '日期' }],
    ['timePicker', { label: '时间' }],
    ['json', { label: 'json' }],
    ['function', { label: '函数' }],
  ]), false);

  registerCommand('gc.removeChildInstance', (_, instanceId: number, itemId: number, abstractValueIdChain?: string) => {
    return commandBridge.removeChildInstance(instanceId, itemId, abstractValueIdChain)
  })

  registerCommand('gc.addChildInstance', (_, data) => {
    return commandBridge.addChildInstance(data)
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