import { ExtensionLevel, Resource, ResourcePipelineParams, resourceAppendTask } from "@grootio/common"
import { pipelineExec } from "@grootio/core"
import { getContext } from "context"

export const createResourceTaskList = (resourceList: Resource[], viewId?: number) => {
  const { extHandler } = getContext().groot
  let viewResourceExtScriptModuleList = []
  let solutionResourceExtScriptModuleList = []

  const appResourceExtScriptModuleList = extHandler.getPipeline('resource', ExtensionLevel.Application)

  if (viewId) {
    viewResourceExtScriptModuleList = extHandler.getPipeline('resource', ExtensionLevel.View, viewId)

    solutionResourceExtScriptModuleList = extHandler.getPipeline('resource', ExtensionLevel.Solution, viewId)
  }

  const resourceTaskList = []
  resourceList.forEach(resource => {
    pipelineExec<ResourcePipelineParams>({
      viewExtList: viewResourceExtScriptModuleList,
      solutionExtList: solutionResourceExtScriptModuleList,
      appExtList: appResourceExtScriptModuleList,
      params: {
        resource: resource as any,
        defaultFn: () => { },
        local: true,
        appendTask: resourceAppendTask(resource, resourceTaskList)
      }
    })
  })

  return resourceTaskList
}