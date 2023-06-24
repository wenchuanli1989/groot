import { mapFilter, viewRender } from "@grootio/common";
import { Tabs } from "antd";
import { grootManager } from "context";

const Panel = () => {
  const { useStateByName } = grootManager.state
  const [viewContainerMap] = useStateByName('gs.ui.viewContainerMap');
  const [viewKeySet] = useStateByName('gs.ui.panel.viewContainers');
  const viewList = mapFilter(viewContainerMap, (key, value) => viewKeySet.has(key))

  return <>
    <Tabs items={viewList.map(item => {
      return {
        key: item.id,
        label: viewRender(item.name),
        children: viewRender(item.view)
      }
    })} />
  </>
}

export default Panel;