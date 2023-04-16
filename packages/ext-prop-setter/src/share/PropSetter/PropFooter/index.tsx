import { useModel } from '@grootio/common';
import { useEffect, useRef } from 'react';
import PropHandleModel from '../PropHandleModel';

import styles from './index.module.less';


const PropFooter: React.FC = () => {
  const propPathChainRef = useRef<HTMLElement>();
  const propHandleModel = useModel(PropHandleModel);

  useEffect(() => {
    propHandleModel.propPathChainEle = propPathChainRef.current;
  }, [propPathChainRef.current])


  return <div className={styles.container}>
    <span ref={propPathChainRef} ></span>
  </div>
}

export default PropFooter;