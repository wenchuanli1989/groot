import { APIPath, Component } from "@grootio/common";
import { getContext } from "context";
import { useEffect, useState } from "react";
import { DragComponent } from "./DragComponent";

import styles from './index.module.less'

export const Material = () => {
  const [componentList, setComponentList] = useState<Component[]>([]);

  useEffect(() => {
    getContext().request(APIPath.solution_componentList_solutionVersionId, { solutionVersionId: 1, all: false }).then(({ data }) => {
      setComponentList(data);
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