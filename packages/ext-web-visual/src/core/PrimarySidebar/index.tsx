import { viewRender } from "@grootio/common";
import { grootManager } from "context";

const PrimarySidebar = () => {
  const { useStateByName } = grootManager.state
  const [viewsContainers] = useStateByName('gs.ui.viewsContainers', []);
  const [viewKey] = useStateByName('gs.ui.primarySidebar.active', '');
  const view = viewsContainers.find(item => item.id === viewKey)?.view

  return viewRender(view)
}

export default PrimarySidebar;