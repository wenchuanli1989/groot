import { UIManagerConfig } from "@grootio/common";

import { createComponent, refreshComponent } from "./compiler";

export const defaultConfig: Partial<UIManagerConfig> = {
  modules: {
    groot: {
      ///
    },
  },
  createComponent,
  refreshComponent
};
