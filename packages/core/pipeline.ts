import { ExtensionPipelineLevel, ExtScriptModule } from '@grootio/common'

export const pipelineExec = <P>({ viewExtList, appExtList, solutionExtList, params }: { viewExtList: ExtScriptModule<P>[], solutionExtList: ExtScriptModule<P>[], appExtList: ExtScriptModule<P>[], params: P }) => {
  const viewExtMap = new Map<ExtensionPipelineLevel, ExtScriptModule<P>[]>()
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

  prePipeline(viewExtList, viewExtMap, params)
  prePipeline(appExtList, appExtMap, params)
  prePipeline(solutionExtList, solutionExtMap, params)

  pipeline([
    ...(viewExtMap.get(ExtensionPipelineLevel.Hight) || []),
    ...(viewExtMap.get(ExtensionPipelineLevel.Normal) || []),
    ...(viewExtMap.get(ExtensionPipelineLevel.Low) || []),

    ...(appExtMap.get(ExtensionPipelineLevel.Hight) || []),
    ...(appExtMap.get(ExtensionPipelineLevel.Normal) || []),
    ...(appExtMap.get(ExtensionPipelineLevel.Low) || []),

    ...(solutionExtMap.get(ExtensionPipelineLevel.Hight) || []),
    ...(solutionExtMap.get(ExtensionPipelineLevel.Normal) || []),
    ...(solutionExtMap.get(ExtensionPipelineLevel.Low) || []),

  ], params)
}
