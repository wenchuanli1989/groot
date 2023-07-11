import { List } from "antd";
import { PostMessageType, PropMetadataData } from "@grootio/common";
import { grootManager } from "context";

const ComponentChildren: React.FC<{ value?: PropMetadataData }> = ({ value }) => {

  return <List size="small" bordered dataSource={value?.list || []}
    renderItem={item => (
      <List.Item onClick={() => {
        grootManager.hook.callHook(PostMessageType.OuterComponentSelect, item.instanceId)
      }}>
        {item.componentName}
      </List.Item>
    )} />
}

export default ComponentChildren;