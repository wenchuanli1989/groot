import { APIPath, Component } from "@grootio/common";
import { getContext } from "context";
import { useEffect, useState } from "react";
import { DragComponent } from "./DragComponent";

import styles from './index.module.less'

export const Material = () => {
  const [componentList, setComponentList] = useState<Component[]>([]);

  useEffect(() => {
    getContext().request(APIPath.solutionComponent_list_solutionVersionId, { solutionVersionId: 1, entry: 'false' }).then(({ data }) => {
      setComponentList(data.map(item => {
        item.component.componentVersionId = item.componentVersionId
        return item.component
      }));
    })
  }, []);

  return <div className={styles.container}>
    {
      componentList.map((component) => {
        return <DragComponent component={component} key={component.id} />
      })
    }
  </div>
}