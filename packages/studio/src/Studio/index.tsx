import { APIPath, ExtensionContext, GridLayout, GrootContextParams, StudioMode, loadRemoteModule } from '@grootio/common';
import { useEffect, useState } from 'react';
import request from 'util/request';
import { commandManager, createExtScriptModule, extHandler, hookManager, launchExtension, loadExtension, setGrootContext, setRegistorReady, stateManager } from './groot';
import Workbench from './Workbench';



const Studio: React.FC<{ params: Record<string, string> } & { account: any }> & { Wrapper: React.FC<{ account: any }> } = (props) => {
  const [layout, setLayout] = useState<GridLayout>();
  const [startWork, setStartWork] = useState(false)

  useEffect(() => {

    hookManager().registerHook('gh.allReady', () => {
      setStartWork(true)
    })

    request(APIPath.secretCore, {
      mode: props.params.mode as StudioMode,
      releaseId: props.params.releaseId,
      solutionVersionId: props.params.solutionVersionId
    }).then(({ data: extInstance }) => {
      const { packageName, moduleName, assetUrl } = extInstance.extensionVersion
      loadCoreExt(packageName, moduleName, assetUrl)
    })
  }, [])

  const loadCoreExt = (packageName: string, moduleName: string, assetUrl: string) => {
    loadRemoteModule(packageName, moduleName, assetUrl).then((extModule) => {
      const layout = new GridLayout();
      setLayout(layout);

      const grootParams = {
        ...props.params,
        account: props.account
      } as GrootContextParams

      setGrootContext(grootParams, layout, (extInstance) => {
        if (extInstance.extensionVersion.propItemPipelineRaw) {
          extInstance.propItemPipeline = createExtScriptModule(extInstance.extensionVersion.propItemPipelineRaw)
          extInstance.propItemPipeline.id = extInstance.id;
        }
        if (extInstance.extensionVersion.resourcePipelineRaw) {
          extInstance.resourcePipeline = createExtScriptModule(extInstance.extensionVersion.resourcePipelineRaw)
          extInstance.resourcePipeline.id = extInstance.id;
        }
      })

      const requestClone = request.clone((type) => {
        if (type === 'request') {
          // ...
        }
      });

      setRegistorReady(false)
      let readyCallback: Function
      extModule.default({
        params: grootParams,
        layout,
        extension: null,
        request: requestClone,
        groot: {
          extHandler,
          loadExtension,
          launchExtension,
          stateManager,
          commandManager,
          hookManager,
          onReady: function (callback) {
            readyCallback = callback
          }
        }
      } as ExtensionContext)
      setRegistorReady(true)
      readyCallback()
    })
  }

  return layout && startWork ? <Workbench layout={layout} /> : null

}

Studio.Wrapper = (account) => {
  // const [searchParams] = useSearchParams();
  if (!account) {
    return null
  }

  const searchParams = (location.search.substring(1) || '').split('&').reduce((searchMap, curr) => {
    const [key, value] = curr.split('=')
    searchMap[key] = value
    return searchMap
  }, {})

  return <Studio params={searchParams as any} account={account} />
}

export default Studio;
