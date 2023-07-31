import { APIPath, SolutionComponent } from "@grootio/common";
import { getContext } from "context";
import { useEffect, useState } from "react";
import { DragComponent } from "./DragComponent";

import styles from './index.module.less'

export const Material = () => {
  const [solutionComponentList, setSolutionComponentList] = useState<SolutionComponent[]>([]);

  useEffect(() => {
    getContext().request(APIPath.solutionComponent_list_solutionVersionId, { solutionVersionId: 1, view: 'false', queryVersionList: false, queryTagList: false }).then(({ data }) => {
      setSolutionComponentList(data);
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