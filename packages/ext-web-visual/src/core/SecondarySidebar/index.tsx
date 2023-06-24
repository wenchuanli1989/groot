import { viewRender } from "@grootio/common";
import { grootManager } from "context";

const SecondarySidebar = () => {
  const { useStateByName } = grootManager.state
  const [viewContainerMap] = useStateByName('gs.ui.viewContainerMap');
  const [viewKey] = useStateByName('gs.ui.secondarySidebar.active', '');
  const view = viewContainerMap.get(viewKey)?.view

  return viewRender(view)
}

export default SecondarySidebar;