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
    const extension = em.create(Extension, {
      name: '@groot/core-extension',
      org,
    });
    await em.persistAndFlush(extension);

    const code = em.create(LargeText, {
      text: defaultPropItemPipeline
    })

    const codeRaw = em.create(LargeText, {
      text: defaultPropItemPipeline
    })

    await em.persistAndFlush(code);
    await em.persistAndFlush(codeRaw);

    // 创建插件版本
    const extensionVersion = em.create(ExtensionVersion, {
      name: '0.0.1',
      packageName: '_groot_core_extension',
      moduleName: 'Main',
      assetUrl: 'http://groot-local.com:12000/groot-core-extension/index.js',
      propItemPipeline: code,
      propItemPipelineRaw: codeRaw,
      extension
    })
    await em.persistAndFlush(extension);

    extension.recentVersion = extensionVersion
    await em.persistAndFlush(extension);
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
    const solutionExtensionInstance = em.create(ExtensionInstance, {
      extension,
      extensionVersion,
      config: '',
      relationType: ExtensionRelationType.SolutionVersion,
      relationId: solutionVersion.id,
    });
    await em.persistAndFlush(solutionExtensionInstance);

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
    const releaseExtensionInstance = em.create(ExtensionInstance, {
      extension,
      extensionVersion,
      config: '',
      relationType: ExtensionRelationType.Release,
      relationId: release.id,
    });
    await em.persistAndFlush(releaseExtensionInstance);


    await proTableCreate(em, solution, release, extensionVersion);

    await btnCreate(em, solution, release, extensionVersion);

    await profileCreate(em, solution, release, extensionVersion);

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