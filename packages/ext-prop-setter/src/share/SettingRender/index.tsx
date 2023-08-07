import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { PropItemSettingRenderProps, PropItemViewType } from "@grootio/common";
import { Form, Input, Space, Typography } from "antd";

const SettingRender: React.FC<PropItemSettingRenderProps> = ({ propItem, defaultRender, form }) => {

  if (![PropItemViewType.Select, PropItemViewType.ButtonGroup, PropItemViewType.Checkbox, PropItemViewType.Radio].includes(propItem.viewType as PropItemViewType)) {
    return (<>类型异常</>)
  }

  return (<Form form={form} colon={false} labelAlign="right" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} >
    {defaultRender}
    <Form.Item label="选项" >
      <Form.List name="optionList" initialValue={[{}]} >
        {(fields, { add, remove }) => {
          return <>
            {fields.map(({ key, name, ...restField }, index) => {
              return <Space key={key} align="baseline">
                <Form.Item name={[name, 'label']} {...restField} rules={[{ required: true }]}>
                  <Input placeholder="请输入名称" />
                </Form.Item>
                <Form.Item name={[name, 'value']} {...restField} rules={[{ required: true }]}>
                  <Input placeholder="请输入数据" />
                </Form.Item>

                <Form.Item noStyle dependencies={['type']}>
                  {() => {
                    const type = form.getFieldValue('type');
                    return type === PropItemViewType.ButtonGroup ? <Form.Item name={[name, 'title']} {...restField} >
                      <Input placeholder="请输入描述" />
                    </Form.Item> : null;
                  }}
                </Form.Item>

                <Form.Item noStyle dependencies={['viewType']}>
                  {() => {
                    const viewType = form.getFieldValue('viewType');
                    return viewType === PropItemViewType.ButtonGroup ? <Form.Item name={[name, 'icon']} {...restField} >
                      <Input placeholder="请输入图标" />
                    </Form.Item> : null;
                  }}
                </Form.Item>

                <Typography.Link onClick={() => add({ label: '', value: '' }, index + 1)}>
                  <PlusOutlined />
                </Typography.Link>
                <Typography.Link disabled={fields.length === 1} onClick={() => remove(name)}>
                  <DeleteOutlined />
                </Typography.Link>
              </Space>
            })}
          </>
        }}
      </Form.List>
    </Form.Item>
  </Form>
  )
}

export default SettingRender;