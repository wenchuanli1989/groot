import { viewRender } from "@grootio/common";
import { grootManager } from "context";

const Stage = () => {
  const { useStateByName } = grootManager.state
  const [viewItemMap] = useStateByName('gs.ui.viewMap');
  const [viewKey] = useStateByName('gs.ui.stage.active', '');
  const view = viewItemMap.get(viewKey)?.view

  return viewRender(view)
}

export default Stage;