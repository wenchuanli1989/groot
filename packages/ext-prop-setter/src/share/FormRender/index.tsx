import { QuestionCircleOutlined } from "@ant-design/icons";
import { PropItem, PropItemStruct, PropItemViewType, useModel } from "@grootio/common";
import { Button, Checkbox, DatePicker, Form, Input, InputNumber, Radio, Select, Switch, SwitchProps, TimePicker, Tooltip } from "antd";
import dayjs from "dayjs";
import ComponentChildren from "./ComponentChildren";
import NumberSlider from "./NumberSlider";
import TextEditor from "./TextEditor";
import PropHandleModel from "share/PropSetter/PropHandleModel";

type PropType = {
  formItemProps: any,
  propItem: PropItem,
  simplify: boolean
}

const FormRender: React.FC<PropType> = ({ propItem, simplify, formItemProps, ...props }) => {
  const propHandleModel = useModel(PropHandleModel);

  let field = <>未知类型</>
  let initialValue = formItemProps.initialValue ? JSON.parse(formItemProps.initialValue.replace(/\n|\r/mg, '')) : undefined;

  if (propItem.viewType === PropItemViewType.Text) {
    field = <Input {...props} />;
  } else if (propItem.viewType === PropItemViewType.Number) {
    field = <InputNumber keyboard {...props} />;
  } else if (propItem.viewType === PropItemViewType.Switch) {
    formItemProps.valuePropName = 'checked'
    field = <SwitchPatch {...props} />
  } else if (propItem.viewType === PropItemViewType.Select) {
    field = <Select options={propItem.optionList} {...props} />
  } else if (propItem.viewType === PropItemViewType.DatePicker) {
    field = <DatePicker {...props} />;
    initialValue = dayjs(JSON.parse(formItemProps.initialValue));
  } else if (propItem.viewType === PropItemViewType.TimePicker) {
    field = <TimePicker style={{ width: '100%' }} {...props} />;
    initialValue = dayjs(JSON.parse(formItemProps.initialValue));
  } else {

    if (simplify) {
      field = <>
        该类型不支持 <Tooltip title="仅支持文本，数字，开关，下拉框，日期，时间">
          <QuestionCircleOutlined />
        </Tooltip>
      </>
    } else {
      if (propItem.struct === PropItemStruct.Flat) {
        field = <Button block onClick={() => {
          propHandleModel.pushPropItemToStack(propItem)
        }}>平铺</Button>
      } else if (propItem.struct === PropItemStruct.Hierarchy) {
        field = <Button block onClick={() => {
          propHandleModel.pushPropItemToStack(propItem)
        }}>层级</Button>
      } else if (propItem.struct === PropItemStruct.Component) {
        field = <ComponentChildren {...props} />
      } else if (propItem.viewType === PropItemViewType.Textarea) {
        field = <Input.TextArea {...props} />;
      } else if (propItem.viewType === PropItemViewType.Slider) {
        field = <NumberSlider min={1} max={100} {...props} />;
      } else if (propItem.viewType === PropItemViewType.ButtonGroup) {
        field = <Radio.Group {...props}>
          {propItem.optionList.map((option) => {
            return <Tooltip title={option.title} key={option.value}>
              <Radio.Button value={option.value}>{option.label}</Radio.Button>
            </Tooltip>
          })}
        </Radio.Group>;
      } else if (propItem.viewType === PropItemViewType.Radio) {
        field = <Radio.Group options={propItem.optionList} {...props} />
      } else if (propItem.viewType === PropItemViewType.Checkbox) {
        field = <Checkbox.Group options={propItem.optionList} {...props} />
      } else if (propItem.viewType === PropItemViewType.Json) {
        field = <TextEditor type="json" {...props} />
      } else if (propItem.viewType === PropItemViewType.Function) {
        field = <TextEditor type="function" {...props} />
      }
    }
  }

  return <Form.Item {...formItemProps} initialValue={initialValue}>{field}</Form.Item>

}

const SwitchPatch: React.FC<SwitchProps & React.RefAttributes<HTMLElement> | { onChange: any }> = ({ onChange, ...params }) => {
  return <Switch onChange={(checked, event) => {
    onChange(checked ? 1 : 0, event)
  }} {...params} />
}

export default FormRender