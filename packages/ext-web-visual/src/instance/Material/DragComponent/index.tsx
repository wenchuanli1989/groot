import { DropboxOutlined } from "@ant-design/icons";
import { Component } from "@grootio/common";
import { Button } from "antd";
import { grootManager } from "context";


export const DragComponent: React.FC<{ component: Component }> = ({ component }) => {

  const { callHook } = grootManager.hook
  const dragstart = (e) => {
    callHook('gh.component.dragStart')
    e.dataTransfer.setData('componentId', component.id);
    e.dataTransfer.setData('componentVersionId', component.activeVersionId);
  }

  const dragend = () => {
    callHook('gh.component.dragEnd')
  }

  return (<Button style={{ width: '100px', marginBottom: '10px', textAlign: 'left', paddingLeft: '8px' }}
    icon={<DropboxOutlined />} draggable="true" onDragStart={dragstart} onDragEnd={dragend}>
    {component.name}
  </Button>)
}