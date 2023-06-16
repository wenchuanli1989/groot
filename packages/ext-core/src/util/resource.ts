import { ExtensionLevel, ExtensionStatus, Resource, ResourcePipelineParams, resourceAppendTask } from "@grootio/common"
import { pipelineExec } from "@grootio/core"
import { getContext } from "context"

export const createResourceTaskList = (resourceList: Resource[], entryId?: number) => {
  const { extHandler } = getContext().groot
  let entryResourceExtScriptModuleList = []
  let solutionResourceExtScriptModuleList = []

  const appResourceExtScriptModuleList = extHandler.getPipeline('resource', ExtensionLevel.Application)

  if (entryId) {
    entryResourceExtScriptModuleList = extHandler.getPipeline('resource', ExtensionLevel.Entry, entryId)

    solutionResourceExtScriptModuleList = extHandler.getPipeline('resource', ExtensionLevel.Solution, entryId)
  }

  const resourceTaskList = []
  resourceList.forEach(resource => {
    pipelineExec<ResourcePipelineParams>({
      entryExtList: entryResourceExtScriptModuleList,
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