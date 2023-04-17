import { viewRender } from "@grootio/common";
import { grootManager } from "context";

const Stage = () => {
  const { useStateByName } = grootManager.state
  const [viewItemList] = useStateByName('gs.ui.views', []);
  const [viewKey] = useStateByName('gs.ui.stage.active', '');
  const view = viewItemList.find(item => item.id === viewKey)?.view

  return viewRender(view)
}

export default Stage;