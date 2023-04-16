import { grootManager, isPrototypeMode } from "context";
import { instanceBootstrap } from "instance";
import { prototypeBootstrap } from "prototype";
import { shareBootstrap } from "share";

export const startup = () => {
  const { registerCommand } = grootManager.command

  shareBootstrap();

  if (isPrototypeMode()) {
    prototypeBootstrap();
  } else {
    instanceBootstrap();
  }
}