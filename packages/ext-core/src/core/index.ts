import { StudioMode } from "@grootio/common";
import { message } from "antd";
import { getContext, isPrototypeMode } from "context";
import { instanceBootstrap } from "instance";
import { prototypeBootstrap } from "prototype";
import { shareBootstrap } from "share";

export const startup = () => {

  const solutionVersionId = +getContext().params.solutionVersionId
  const releaseId = +getContext().params.releaseId

  if (isPrototypeMode()) {
    if (!solutionVersionId) {
      setTimeout(() => {
        message.warning('参数solutionVersionId为空');
      })
      return null;
    }
  } else {
    if (!releaseId) {
      setTimeout(() => {
        message.warning('参数releaseId不能为空');
      })
      return null;
    }
  }

  shareBootstrap()

  if (isPrototypeMode()) {
    prototypeBootstrap();
  } else {
    instanceBootstrap()
  }
}