import { getContext, grootManager, isPrototypeMode } from "context";
import { PropSetter } from "./PropSetter";
import FormRender from './FormRender'
import { ViewsContainer } from "@grootio/common";


export const shareBootstrap = () => {
  const { groot } = getContext();
  const { registerState } = grootManager.state

  const viewsContainers = new Map()
  const propSetterView = {
    id: 'propSetter',
    name: '属性设置器',
    view: () => {
      return <ViewsContainer context={propSetterView} groot={groot} />
    },
  }
  viewsContainers.set(propSetterView.id, propSetterView)
  registerState('gs.ui.viewContainerMap', viewsContainers, false)

  registerState('gs.ui.viewMap', new Map([
    ['propSetter', {
      id: 'propSetter',
      name: '属性设置器',
      view: <PropSetter />,
      parent: 'propSetter'
    }]
  ]), false)

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