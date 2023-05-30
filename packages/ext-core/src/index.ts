
import { MainFunction } from '@grootio/common';
import { setContext } from 'context';
import { startup } from 'core';

const Main: MainFunction<any> = (context) => {
  setContext(context);

  startup()

  return {

  };
}


export default Main;