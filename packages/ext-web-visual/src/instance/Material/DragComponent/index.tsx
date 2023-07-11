import { DropboxOutlined } from "@ant-design/icons";
import { SolutionComponent } from "@grootio/common";
import { Button } from "antd";
import { grootManager } from "context";


export const DragComponent: React.FC<{ solutionComponent: SolutionComponent }> = ({ solutionComponent }) => {

  const { callHook } = grootManager.hook
  const dragstart = (e) => {
    callHook('gh.component.dragStart')
    e.dataTransfer.setData('componentId', solutionComponent.component.id);
    e.dataTransfer.setData('componentVersionId', solutionComponent.componentVersionId);
    e.dataTransfer.setData('solutionVersionId', solutionComponent.solutionVersionId);
    e.dataTransfer.setData('solutionComponentId', solutionComponent.id);
  }

  const dragend = () => {
    callHook('gh.component.dragEnd')
  }

  return (<Button style={{ width: '100px', marginBottom: '10px', textAlign: 'left', paddingLeft: '8px' }}
    icon={<DropboxOutlined />} draggable="true" onDragStart={dragstart} onDragEnd={dragend}>
    {solutionComponent.component.name}
  </Button>)
}