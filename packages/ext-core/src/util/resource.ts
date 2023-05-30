import { ResourcePipelineParams, resourceAppendTask } from "@grootio/common"
import { pipelineExec } from "@grootio/core"
import { getContext, grootManager } from "context"

export const createResourceTaskList = (isLocalResource = true) => {
  const { extHandler } = getContext().groot
  let entryResourceExtScriptModuleList = []
  let solutionResourceExtScriptModuleList = []
  let resourceList = [];

  const appResourceExtScriptModuleList = [...(extHandler.application.values() || [])].filter(ext => !!ext.resourcePipeline?.id).map(ext => ext.resourcePipeline)
  if (isLocalResource) {
    entryResourceExtScriptModuleList = [...(extHandler.entry.values() || [])].filter(ext => !!ext.resourcePipeline?.id).map(ext => ext.resourcePipeline)

    solutionResourceExtScriptModuleList = [...extHandler.solution.values()].reduce((pre, curr) => {
      const list = [...curr.values()]
      pre.push(...list)
      return pre;
    }, []).filter(ext => !!ext.resourcePipeline?.id).map(ext => ext.resourcePipeline)

    resourceList = grootManager.state.getState('gs.localResourceList')
  } else {
    resourceList = grootManager.state.getState('gs.globalResourceList')
  }

  const resourceTaskList = []
  resourceList.forEach(resource => {
    pipelineExec<ResourcePipelineParams>(entryResourceExtScriptModuleList, solutionResourceExtScriptModuleList, appResourceExtScriptModuleList, {
      resource: resource as any,
      defaultFn: () => { },
      appendTask: resourceAppendTask(resource, resourceTaskList)
    })
  })

  return resourceTaskList
}