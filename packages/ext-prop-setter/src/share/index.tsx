import { commandBridge, getContext, grootManager, isPrototypeMode } from "context";
import { PropSetter } from "./PropSetter";
import PropItemView from './PropItemView'
import { ViewsContainer } from "@grootio/common";
import PropItemSetting from "./PropItemSetting";


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

  registerState('gs.propItem.type', new Map([
    ['text', { label: '文本', viewRender: PropItemView, settingRender: null, icon: null }],
    ['textarea', { label: '多行文本', viewRender: PropItemView, settingRender: null, icon: null }],
    ['number', { label: '数字', viewRender: PropItemView, settingRender: null, icon: null }],
    ['slider', { label: '滑块', viewRender: PropItemView, settingRender: null, icon: null }],
    ['switch', { label: '开关', viewRender: PropItemView, settingRender: null, icon: null }],
    ['buttonGroup', { label: '按钮组', viewRender: PropItemView, settingRender: PropItemSetting, icon: null }],
    ['select', { label: '下拉框', viewRender: PropItemView, settingRender: PropItemSetting, icon: null }],
    ['checkbox', { label: '多选', viewRender: PropItemView, settingRender: PropItemSetting, icon: null }],
    ['radio', { label: '单选', viewRender: PropItemView, settingRender: PropItemSetting, icon: null }],
    ['datePicker', { label: '日期', viewRender: PropItemView, settingRender: null, icon: null }],
    ['timePicker', { label: '时间', viewRender: PropItemView, settingRender: null, icon: null }],
    ['json', { label: 'json', viewRender: PropItemView, settingRender: null, icon: null }],
    ['function', { label: '函数', viewRender: PropItemView, settingRender: null, icon: null }],
    ['*', { label: '未知', viewRender: () => <>暂不支持该类型</>, settingRender: null, icon: null }]
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