import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { ExtensionRelationType } from '@grootio/common';

import { Application } from '../entities/Application';
import { Release } from '../entities/Release';
import { Organization } from '../entities/Organization';
import { Project } from '../entities/Project';
import { Extension } from '../entities/Extension';
import { Solution } from '../entities/Solution';
import { ExtensionInstance } from '../entities/ExtensionInstance';
import { ExtensionVersion } from '../entities/ExtensionVersion';
import { SolutionVersion } from '../entities/SolutionVersion';
import { LargeText } from '../entities/LargeText';

import { create as btnCreate } from './button';
import { create as profileCreate } from './profile';
import { create as proTableCreate } from './pro-table';
import { ProjectResource } from '../entities/ProjectResource';
import { ResourceConfig } from '../entities/ResourceConfig';
import { AppResource } from '../entities/AppResource';

export class DatabaseSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    // 创建组织
    const org = em.create(Organization, {
      name: '管理平台',
    });
    await em.persistAndFlush(org);

    // 创建插件
    const extWebVisual = em.create(Extension, { name: '@groot/ext-web-visual', org });
    await em.persistAndFlush(extWebVisual);

    const extPropSetter = em.create(Extension, { name: '@groot/ext-prop-setter', org });
    await em.persistAndFlush(extPropSetter);

    const extWorkArea = em.create(Extension, { name: '@groot/ext-work-area', org });
    await em.persistAndFlush(extWorkArea);

    const extCore = em.create(Extension, { name: '@groot/ext-core', org });
    await em.persistAndFlush(extCore);


    const propPipelineCode = em.create(LargeText, {
      text: defaultPropItemPipeline
    })

    const propPipelineCodeRaw = em.create(LargeText, {
      text: defaultPropItemPipeline
    })

    const resourcePipelineCode = em.create(LargeText, {
      text: resourcePipeline
    })

    const resourcePipelineCodeRaw = em.create(LargeText, {
      text: resourcePipeline
    })

    await em.persistAndFlush(propPipelineCode);
    await em.persistAndFlush(propPipelineCodeRaw);
    await em.persistAndFlush(resourcePipelineCode);
    await em.persistAndFlush(resourcePipelineCodeRaw);

    // 创建插件版本
    const extWebVisualVersion = em.create(ExtensionVersion, {
      name: '0.0.1',
      packageName: '_ext_web_visual',
      moduleName: 'Main',
      assetUrl: 'http://groot-local.com:20000/ext-web-visual/index.js',
      extension: extWebVisual
    })
    await em.persistAndFlush(extWebVisualVersion);

    extWebVisual.recentVersion = extWebVisualVersion
    await em.persistAndFlush(extWebVisual);

    const extPropSetterVersion = em.create(ExtensionVersion, {
      name: '0.0.1',
      packageName: '_ext_prop_setter',
      moduleName: 'Main',
      assetUrl: 'http://groot-local.com:21000/ext-prop-setter/index.js',
      extension: extPropSetter,
      propItemPipeline: propPipelineCode,
      propItemPipelineRaw: propPipelineCodeRaw,
      resourcePipeline: resourcePipelineCode,
      resourcePipelineRaw: resourcePipelineCodeRaw
    })
    await em.persistAndFlush(extPropSetterVersion);

    extPropSetter.recentVersion = extPropSetterVersion
    await em.persistAndFlush(extPropSetter);

    const extWorkAreaVersion = em.create(ExtensionVersion, {
      name: '0.0.1',
      packageName: '_ext_work_area',
      moduleName: 'Main',
      assetUrl: 'http://groot-local.com:22000/ext-work-area/index.js',
      extension: extWorkArea
    })
    await em.persistAndFlush(extWorkAreaVersion);

    extWorkArea.recentVersion = extWorkAreaVersion
    await em.persistAndFlush(extWorkArea);

    const extCoreVersion = em.create(ExtensionVersion, {
      name: '0.0.1',
      packageName: '_ext_core',
      moduleName: 'Main',
      assetUrl: 'http://groot-local.com:12000/ext-core/index.js',
      extension: extCore
    })
    await em.persistAndFlush(extCoreVersion);

    extCore.recentVersion = extCoreVersion
    await em.persistAndFlush(extCore);

    // 创建解决方案
    const solution = em.create(Solution, {
      name: '通用解决方案',
      org
    })
    await em.persistAndFlush(solution);

    // 创建解决方案版本
    const solutionVersion = em.create(SolutionVersion, {
      name: '0.0.1',
      playgroundPath: '/layout/groot/playground',
      debugBaseUrl: 'http://groot-local.com:11000',
      solution
    })
    await em.persistAndFlush(solutionVersion);

    solution.recentVersion = solutionVersion
    await em.persistAndFlush(solution);

    // 解决方案关联扩展实例
    const extWebVisualSolutionInstance = em.create(ExtensionInstance, {
      extension: extWebVisual,
      extensionVersion: extWebVisualVersion,
      config: '',
      relationType: ExtensionRelationType.Solution,
      relationId: solutionVersion.id,
    });
    await em.persistAndFlush(extWebVisualSolutionInstance);

    const extPropSetterSolutionInstance = em.create(ExtensionInstance, {
      extension: extPropSetter,
      extensionVersion: extPropSetterVersion,
      config: '',
      relationType: ExtensionRelationType.Solution,
      relationId: solutionVersion.id,
    });
    await em.persistAndFlush(extPropSetterSolutionInstance);

    const extWorkAreaSolutionInstance = em.create(ExtensionInstance, {
      extension: extWorkArea,
      extensionVersion: extWorkAreaVersion,
      config: '',
      relationType: ExtensionRelationType.Solution,
      relationId: solutionVersion.id,
    });
    await em.persistAndFlush(extWorkAreaSolutionInstance);

    const extCoreInstance = em.create(ExtensionInstance, {
      extension: extCore,
      extensionVersion: extCoreVersion,
      config: '',
      relationType: ExtensionRelationType.Solution,
      relationId: solutionVersion.id,
      secret: true
    });
    await em.persistAndFlush(extCoreInstance);

    // 创建项目
    const project = em.create(Project, {
      name: '后台系统',
      org
    });
    await em.persistAndFlush(project);

    // 创建应用
    const application = em.create(Application, {
      key: 'demo',
      name: '管理端应用',
      playgroundPath: '/layout/groot/playground',
      debugBaseUrl: 'http://groot-local.com:11000',
      project,
    });
    await em.persistAndFlush(application);

    // 创建迭代
    const release = em.create(Release, {
      name: 'v0.0.1',
      application,
      debugBaseUrl: application.debugBaseUrl,
      playgroundPath: application.playgroundPath
    });
    application.devRelease = release;
    application.qaRelease = release;
    application.plRelease = release;
    application.onlineRelease = release;
    await em.persistAndFlush(release);

    // 创建应用迭代级别扩展实例
    const extWebVisualReleaseInstance = em.create(ExtensionInstance, {
      extension: extWebVisual,
      extensionVersion: extWebVisualVersion,
      config: '',
      relationType: ExtensionRelationType.Application,
      relationId: release.id,
    });
    await em.persistAndFlush(extWebVisualReleaseInstance);

    const extPropSetterReleaseInstance = em.create(ExtensionInstance, {
      extension: extPropSetter,
      extensionVersion: extPropSetterVersion,
      config: '',
      relationType: ExtensionRelationType.Application,
      relationId: release.id,
    });
    await em.persistAndFlush(extPropSetterReleaseInstance);

    const extWorkAreaReleaseInstance = em.create(ExtensionInstance, {
      extension: extWorkArea,
      extensionVersion: extWorkAreaVersion,
      config: '',
      relationType: ExtensionRelationType.Application,
      relationId: release.id,
    });
    await em.persistAndFlush(extWorkAreaReleaseInstance);


    const extCoreReleaseInstance = em.create(ExtensionInstance, {
      extension: extCore,
      extensionVersion: extCoreVersion,
      config: '',
      relationType: ExtensionRelationType.Application,
      relationId: release.id,
      secret: true
    });
    await em.persistAndFlush(extCoreReleaseInstance);

    const resourceConfig = em.create(ResourceConfig, {
      name: 'aaa',
      value: 'http://groot-local.com:10000/workbench/resource-demo',
      type: 'www'
    })

    await em.persistAndFlush(resourceConfig)

    const projectResource = em.create(ProjectResource, {
      project,
      name: 'title',
      value: '凄凄切切群',
      namespace: 'state',
      resourceConfig
    })

    await em.persistAndFlush(projectResource)

    const appResource = em.create(AppResource, {
      app: application,
      release,
      name: 'demo1',
      value: '/demo1',
      namespace: 'dataSource',
      resourceConfig
      // imageResource: projectResource
    })
    await em.persistAndFlush(appResource)


    await proTableCreate(em, solution, release);

    await btnCreate(em, solution, release, project);

    await profileCreate(em, solution, release);

  }
}

const defaultPropItemPipeline = `
const exec = ({propItem,metadata,defaultFn,propKeyChain,appendTask}) => {

  defaultFn()

  appendTask('dateTime','_value = _shared.dayjs(_rawValue)')
}

const check = ({propItem}) => {
  if (propItem.viewType === 'datePicker' || propItem.viewType === 'timePicker') {
    return 'low'
  }

  return 'ignore'
}

module.exports = {
  exec,
  check
}

`

const resourcePipeline = `
const exec = ({resource,defaultFn,appendTask}) => {
  // defaultFn()
  // resource.value = Math.random()
  appendTask('request',' _value = ' + taskMain.toString() + '(_storage,_rawValue,_refresh,_config)','_storage = ' + taskInit.toString() + '(_groot,_shared)')
}

const taskInit = function(_groot,_shared) {
  return {cache: new Map(),loading: new Map()}
}

const taskMain = function(_storage,_rawValue,_refresh,_config) {
  return {
    get: () => {
      if(_storage.cache.has(_rawValue)){
        return _storage.cache.get(_rawValue)
      }else if(_storage.loading.has(_rawValue)){
        return null
      } else{
        _storage.loading.set(_rawValue,true)
        fetch(_config.value + _rawValue).then(res => res.json()).then(res => {
          _storage.loading.delete(_rawValue)
          _storage.cache.set(_rawValue,res.data)
          _refresh()
        })
        return null
      }
    }
  }
}

const check = ({resource}) => {
  if (resource.namespace === 'dataSource') {
    return 'low'
  }

  return 'ignore'
}

module.exports = {
  exec,
  check
}
`