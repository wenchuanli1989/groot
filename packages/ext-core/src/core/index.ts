import { isPrototypeMode } from "context";
import { instanceBootstrap } from "instance";
import { prototypeBootstrap } from "prototype";
import { shareBootstrap } from "share";

export const startup = () => {
  shareBootstrap()

  if (isPrototypeMode()) {
    prototypeBootstrap();
  } else {
    instanceBootstrap()
  }
}