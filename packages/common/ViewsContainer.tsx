
import React from 'react'
import { ViewContainerItem, GrootContext } from './extension'
import { viewRender } from './util';

export const ViewsContainer: React.FC<{ context: ViewContainerItem, groot: GrootContext }> = ({ context, groot }) => {
  const { useStateByName } = groot.stateManager()
  const [viewList] = useStateByName('gs.ui.views', []);
  const childrenView = viewList.filter(item => item.parent === context.id)

  return <>{
    childrenView.map(item => viewRender(item.view!, { key: item.id }))
  }</>
}
