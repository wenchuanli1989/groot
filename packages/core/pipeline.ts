import { ExtensionPipelineLevel, ExtScriptModule } from '@grootio/common'

export const pipelineExec = <P>({ entryExtList, appExtList, solutionExtList, params }: { entryExtList: ExtScriptModule<P>[], solutionExtList: ExtScriptModule<P>[], appExtList: ExtScriptModule<P>[], params: P }) => {
  const entryExtMap = new Map<ExtensionPipelineLevel, ExtScriptModule<P>[]>()
  const appExtMap = new Map<ExtensionPipelineLevel, ExtScriptModule<P>[]>()
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

      const next = ext.exec!(params)
      taskIds.push(ext.id)

      if (!next) {
        break
      }
    }
  }

  prePipeline(entryExtList, entryExtMap, params)
  prePipeline(appExtList, appExtMap, params)
  prePipeline(solutionExtList, solutionExtMap, params)

  pipeline([
    ...(entryExtMap.get(ExtensionPipelineLevel.Hight) || []),
    ...(entryExtMap.get(ExtensionPipelineLevel.Normal) || []),
    ...(entryExtMap.get(ExtensionPipelineLevel.Low) || []),

    ...(appExtMap.get(ExtensionPipelineLevel.Hight) || []),
    ...(appExtMap.get(ExtensionPipelineLevel.Normal) || []),
    ...(appExtMap.get(ExtensionPipelineLevel.Low) || []),

    ...(solutionExtMap.get(ExtensionPipelineLevel.Hight) || []),
    ...(solutionExtMap.get(ExtensionPipelineLevel.Normal) || []),
    ...(solutionExtMap.get(ExtensionPipelineLevel.Low) || []),

  ], params)
}
