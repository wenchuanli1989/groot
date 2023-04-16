import { getContext } from "context";



export const instanceBootstrap = () => {
  const { groot } = getContext();


  groot.onReady(() => {
  })
}

