import { ExtensionPipelineLevel, ExtScriptModule } from '@grootio/common'

export const pipeline = <P>(entryExtList: ExtScriptModule<P>[], solutionExtList: ExtScriptModule<P>[], releaseExtList: ExtScriptModule<P>[], params: P) => {
  const entryExtMap = new Map<ExtensionPipelineLevel, ExtScriptModule<P>[]>()
  const releaseExtMap = new Map<ExtensionPipelineLevel, ExtScriptModule<P>[]>()
  const solutionExtMap = new Map<ExtensionPipelineLevel, ExtScriptModule<P>[]>()

  const prePipeline = (extList: ExtScriptModule<P>[], extMap: Map<ExtensionPipelineLevel, ExtScriptModule<P>[]>, params: P) => {
    extList.forEach(ext => {
      const level = ext.check(params)
      if (level === ExtensionPipelineLevel.Ignore) {
        return
      }

      if (!extMap.has(level)) {
        extMap.set(level, [])
      }

      extMap.get(level)!.push(ext)
    })
  }

  const pipeline = (extList: ExtScriptModule<P>[], params: P) => {
    const taskIds: number[] = []
    for (const ext of extList) {
      if (taskIds.includes(ext.id)) {
        continue
      }

      const next = ext.task!(params)
      taskIds.push(ext.id)

      if (!next) {
        break
      }
    }
  }



  prePipeline(entryExtList, entryExtMap, params)
  prePipeline(solutionExtList, solutionExtMap, params)
  prePipeline(releaseExtList, releaseExtMap, params)

  pipeline([
    ...(entryExtMap.get(ExtensionPipelineLevel.Hight) || []),
    ...(entryExtMap.get(ExtensionPipelineLevel.Normal) || []),
    ...(entryExtMap.get(ExtensionPipelineLevel.Low) || []),

    ...(solutionExtMap.get(ExtensionPipelineLevel.Hight) || []),
    ...(solutionExtMap.get(ExtensionPipelineLevel.Normal) || []),
    ...(solutionExtMap.get(ExtensionPipelineLevel.Low) || []),

    ...(releaseExtMap.get(ExtensionPipelineLevel.Hight) || []),
    ...(releaseExtMap.get(ExtensionPipelineLevel.Normal) || []),
    ...(releaseExtMap.get(ExtensionPipelineLevel.Low) || []),

  ], params)
}
