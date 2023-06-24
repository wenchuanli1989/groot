
import React from 'react'
import { ViewContainerItem, GrootContext } from './extension'
import { mapFilter, viewRender } from './util';

export const ViewsContainer: React.FC<{ context: ViewContainerItem, groot: GrootContext }> = ({ context, groot }) => {
  const { useStateByName } = groot.stateManager()
  const [viewMap] = useStateByName('gs.ui.viewMap');
  const childrenView = mapFilter(viewMap, (_, value) => value.parent === context.id)

  return <>{
    childrenView.map(item => viewRender(item.view!, { key: item.id }))
  }</>
}
