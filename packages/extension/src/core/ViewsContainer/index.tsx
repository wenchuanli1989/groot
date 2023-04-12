import { viewRender, ViewContainerItem } from "@grootio/common";
import { grootManager } from "context";

const ViewsContainer: React.FC<{ context: ViewContainerItem }> = ({ context }) => {
  const { useStateByName } = grootManager.state
  const [viewList] = useStateByName('gs.ui.views', []);
  const childrenView = viewList.filter(item => item.parent === context.id)

  return <>{
    childrenView.map(item => viewRender(item.view, { key: item.id }))
  }</>
}

export default ViewsContainer;