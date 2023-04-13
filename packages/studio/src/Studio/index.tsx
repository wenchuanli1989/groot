import { APIPath, Application, ExtensionLevel, ExtensionRuntime, ExtensionStatus, GridLayout, Solution, StudioMode } from '@grootio/common';
import { message } from 'antd';
import { StudioParams } from 'index';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import request from 'util/request';
import { launchExtension, loadExtension } from './groot';
import Workbench from './Workbench';


/**
 * 1.加载解决方案或者应用信息 
 * 2.加载插件
 * 3.启动插件
 * 4.启动工作台
 **/
const Studio: React.FC<StudioParams & { account: any }> & { Wrapper: React.FC<{ account: any }> } = (params) => {
  const [loadStatus, setLoadStatus] = useState<'doing' | 'no-application' | 'no-solution' | 'no-instance' | 'fetch-extension' | 'notfound' | 'ok'>('doing');
  const [layout, setLayout] = useState<GridLayout>();

  useEffect(() => {
    let fetchCoreDataPromise: Promise<Application | Solution>
    let prototypeMode = params.mode === StudioMode.Prototype;
    let extLevel = prototypeMode ? ExtensionLevel.Solution : ExtensionLevel.Application

    if (prototypeMode) {
      fetchCoreDataPromise = fetchSolution(params.solutionId)
    } else {
      fetchCoreDataPromise = fetchApplication(params.appId)
    }

    fetchCoreDataPromise.then((data) => {
      setLoadStatus('fetch-extension');

      const solutionInstanceId = prototypeMode ? (data as Solution).id : 0
      // todo 研究promise自动刷新视图
      loadExtension(data.extensionInstanceList as ExtensionRuntime[], extLevel, solutionInstanceId).then(() => {
        setLoadStatus('ok');
        const layout = new GridLayout();
        setLayout(layout);

        launchExtension(data.extensionInstanceList as ExtensionRuntime[], {
          mode: params.mode,
          application: !prototypeMode ? data as Application : null,
          solution: prototypeMode ? data as Solution : null,
          account: params.account,
          instanceId: params.instanceId,
          componentId: params.componentId,
          versionId: params.versionId
        }, layout, extLevel)

        layout.refresh()
      })
    })
  }, []);

  const fetchSolution = (solutionId: number) => {
    return request(APIPath.solution_detail_solutionId, { solutionId }).then(({ data }) => {
      return data;
    }).catch((e) => {
      setLoadStatus('no-solution');
      return Promise.reject(e);
    })
  }

  const fetchApplication = (applicationId: number) => {
    return request(APIPath.application_detail_applicationId, { applicationId }).then(({ data }) => {
      return data;
    }).catch((e) => {
      setLoadStatus('no-application');
      return Promise.reject(e);
    })
  }


  if (loadStatus === 'doing') {
    return <>load data ...</>
  } else if (loadStatus === 'notfound') {
    return <>notfound component</>
  } else if (loadStatus === 'fetch-extension') {
    return <>load extension ...</>
  } else {
    return <Workbench layout={layout} />
  }
}

Studio.Wrapper = (account) => {
  const [searchParams] = useSearchParams();

  const [params] = useState(() => {
    const mode = searchParams.get('mode') as StudioMode || StudioMode.Instance;
    const solutionId = +searchParams.get('solutionId')
    const appId = +searchParams.get('appId')
    const componentId = +searchParams.get('componentId')
    const instanceId = +searchParams.get('instanceId')
    const releaseId = +searchParams.get('releaseId')
    const versionId = +searchParams.get('versionId')

    if (mode === StudioMode.Instance) {
      if (!appId) {
        setTimeout(() => {
          message.warning('参数appId为空');
        })
        return null;
      }
    } else if (mode === StudioMode.Prototype) {
      if (!solutionId) {
        setTimeout(() => {
          message.warning('参数solutionId为空');
        })
        return null;
      }
    }
    return {
      solutionId,
      appId,
      instanceId,
      releaseId,
      componentId,
      mode,
      versionId
    }
  })

  return <Studio {...params} account={account} />
}

export default Studio;
