import { PropItem, PropItemViewType } from "@grootio/common";

export const uuid = (() => {
  let id = 0xaaaaaaaa;

  return () => {
    return ++id;
  }
})();


