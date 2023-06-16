import './lib-bundle';

import { loadRemoteModule } from '@grootio/common';
import { PanguConfig } from '../pangu';
import bootstrap from './bootstrap';

const panguConfig = process.env.panguConfig as any as PanguConfig;

const appName = window.location.pathname.split('/')[1] || '';
const appConfig = panguConfig.appConfig[appName];

if (appConfig.bootstrap === false) {
  loadRemoteModule(appConfig.packageName, appConfig.moduleName, appConfig.assetUrl).then((module) => {
    module.default({
      appEnv: process.env.APP_ENV,
      appName,
      rootId: panguConfig.rootId,
    });
  })
} else {
  bootstrap();
}



