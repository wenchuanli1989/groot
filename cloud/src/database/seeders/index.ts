import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Application } from '../../entities/Application';
import { Release } from '../../entities/Release';
import { Organization } from '../../entities/Organization';
import { Project } from '../../entities/Project';
import { Extension } from '../../entities/Extension';

import { create as btnCreate } from './button';
import { create as profileCreate } from './profile';
import { create as proTableCreate } from './pro-table';
import { create as containerCreate } from './groot-container';
import { create as pageContainerCreate } from './groot-page-container';
import { Solution } from '../../entities/Solution';
import { ExtensionInstance } from '../../entities/ExtensionInstance';
import { ExtensionRelationType } from '@grootio/common';
import { ExtensionVersion } from '../../entities/ExtensionVersion';
import { SolutionVersion } from '../../entities/SolutionVersion';
import { LargeText } from '../../entities/LargeText';

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


    const code = em.create(LargeText, {
      text: defaultPropItemPipeline
    })

    const codeRaw = em.create(LargeText, {
      text: defaultPropItemPipeline
    })

    await em.persistAndFlush(code);
    await em.persistAndFlush(codeRaw);

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
      propItemPipeline: code,
      propItemPipelineRaw: codeRaw
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


    // 创建解决方案
    const solution = em.create(Solution, {
      name: '通用解决方案',
      org
    })
    await em.persistAndFlush(solution);

    // 创建解决方案版本
    const solutionVersion = em.create(SolutionVersion, {
      name: '0.0.1',
      playgroundPath: '/groot/playground',
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
      relationType: ExtensionRelationType.SolutionVersion,
      relationId: solutionVersion.id,
    });
    await em.persistAndFlush(extWebVisualSolutionInstance);

    const extPropSetterSolutionInstance = em.create(ExtensionInstance, {
      extension: extPropSetter,
      extensionVersion: extPropSetterVersion,
      config: '',
      relationType: ExtensionRelationType.SolutionVersion,
      relationId: solutionVersion.id,
    });
    await em.persistAndFlush(extPropSetterSolutionInstance);

    const extWorkAreaSolutionInstance = em.create(ExtensionInstance, {
      extension: extWorkArea,
      extensionVersion: extWorkAreaVersion,
      config: '',
      relationType: ExtensionRelationType.SolutionVersion,
      relationId: solutionVersion.id,
    });
    await em.persistAndFlush(extWorkAreaSolutionInstance);

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
      playgroundPath: '/groot/playground',
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
      relationType: ExtensionRelationType.Release,
      relationId: release.id,
    });
    await em.persistAndFlush(extWebVisualReleaseInstance);

    const extPropSetterReleaseInstance = em.create(ExtensionInstance, {
      extension: extPropSetter,
      extensionVersion: extPropSetterVersion,
      config: '',
      relationType: ExtensionRelationType.Release,
      relationId: release.id,
    });
    await em.persistAndFlush(extPropSetterReleaseInstance);

    const extWorkAreaReleaseInstance = em.create(ExtensionInstance, {
      extension: extWorkArea,
      extensionVersion: extWorkAreaVersion,
      config: '',
      relationType: ExtensionRelationType.Release,
      relationId: release.id,
    });
    await em.persistAndFlush(extWorkAreaReleaseInstance);


    await proTableCreate(em, solution, release);

    await btnCreate(em, solution, release);

    await profileCreate(em, solution, release);

    await containerCreate(em, solution);

    await pageContainerCreate(em, solution);
  }
}

const defaultPropItemPipeline = `
const task = ({propItem,metadata,defaultFn,propKeyChain}) => {

  defaultFn()

  if (propItem.viewType === 'datePicker' || propItem.viewType === 'timePicker') {
    metadata.advancedProps.push({
      keyChain: propKeyChain,
      type: 'dateTime'
    })

    metadata.postPropTasks['dateTime'] = '_value = _shared.dayjs(_rawValue)'
  } 
}

const check = ({propItem}) => {
  if (!([
    'text',
    'textarea',
    'number',
    'slider',
    'buttonGroup',
    'switch',
    'select',
    'radio',
    'checkbox',
    'datePicker',
    'timePicker',
    'json',
    'function',
  ]).includes(propItem.viewType)) {
    return 'ignore'
  }

  return 'low'
}

module.exports = {
  task,
  check
}

`