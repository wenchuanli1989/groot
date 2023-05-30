import { PropItem, PropItemViewType } from "@grootio/common";

export const parseOptions = (propItem: PropItem) => {
  if (([PropItemViewType.Checkbox, PropItemViewType.Radio, PropItemViewType.Select, PropItemViewType.ButtonGroup] as string[]).includes(propItem.viewType)) {
    propItem.optionList = JSON.parse(propItem.valueOptions || '[]');
  } else {
    propItem.optionList = []
  }
}