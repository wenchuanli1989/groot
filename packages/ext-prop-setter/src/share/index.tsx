import { commandBridge, getContext, grootManager, isPrototypeMode } from "context";
import { PropSetter } from "./PropSetter";
import FormRender from './FormRender'
import { ViewsContainer } from "@grootio/common";


export const shareBootstrap = () => {
  const { groot } = getContext();
  const { registerState } = grootManager.state

  registerState('gs.ui.viewsContainers', [
    {
      id: 'propSetter',
      name: '属性设置器',
      view: function () {
        return <ViewsContainer context={this} groot={groot} />
      },
    }
  ], true)

  registerState('gs.ui.views', [
    {
      id: 'propSetter',
      name: '属性设置器',
      view: <PropSetter />,
      parent: 'propSetter'
    }
  ], true)

  registerState('gs.propItem.formRenderList', [{ viewType: '*', render: FormRender }], true)
  registerState('gs.propItem.viewTypeList', [
    { label: '文本', value: 'text' },
    { label: '多行文本', value: 'textarea' },
    { label: '数字', value: 'number' },
    { label: '滑块', value: 'slider' },
    { label: '按钮组', value: 'buttonGroup' },
    { label: '开关', value: 'switch' },
    { label: '下拉框', value: 'select' },
    { label: '多选', value: 'checkbox' },
    { label: '单选', value: 'radio' },
    { label: '日期', value: 'datePicker' },
    { label: '时间', value: 'timePicker' },
    { label: 'json', value: 'json' },
    { label: '函数', value: 'function' },
  ], true)

  grootManager.command.registerCommand('gc.pushPropItemToStack', (_, propItem) => {
    commandBridge.pushPropItemToStack(propItem)
  })
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