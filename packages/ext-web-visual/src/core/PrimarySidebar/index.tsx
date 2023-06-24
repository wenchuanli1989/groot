import { viewRender } from "@grootio/common";
import { grootManager } from "context";

const PrimarySidebar = () => {
  const { useStateByName } = grootManager.state
  const [viewContainerMap] = useStateByName('gs.ui.viewContainerMap');
  const [viewKey] = useStateByName('gs.ui.primarySidebar.active', '');
  const view = viewContainerMap.get(viewKey)?.view

  return viewRender(view)
}

export default PrimarySidebar;