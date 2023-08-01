import { APIPath, SolutionComponent } from "@grootio/common";
import { getContext, grootManager } from "context";
import { useEffect, useState } from "react";
import { DragComponent } from "./DragComponent";

import styles from './index.module.less'

export const Material = () => {
  const [solutionComponentList, setSolutionComponentList] = useState<SolutionComponent[]>([]);

  useEffect(() => {
    const viewVersionId = grootManager.state.getState('gs.view').viewVersionId;
    getContext().request(APIPath.solutionComponent_listByViewVersionId, { viewVersionId }).then(({ data }) => {
      const { solutionComponentList } = data.find(item => item.primary)
      setSolutionComponentList(solutionComponentList);
    })
  }, []);

  return <div className={styles.container}>
    {
      solutionComponentList.map((solutionComponent) => {
        return <DragComponent solutionComponent={solutionComponent} key={solutionComponent.id} />
      })
    }
  </div>
}