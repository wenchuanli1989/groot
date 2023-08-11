import { useRoutes } from 'react-router-dom';
import routes from './config/routes';
import react from 'react';
import { UIManager } from '@grootio/react';
import { lazy } from 'react';


function App() {
  const element = useRoutes(routes);

  return element;
}


// todo ... 解决modules强引用导致初始包过大问题
UIManager.init({
  appKey: 'demo',
  appEnv: 'dev',
  lazyLoadApplication: true,
  serverUrl: 'http://groot-local.com:10000',
  debug: true,
  modules: {
    react,
    antd: {
      Button: lazy(() => import('antd').then(pkg => ({ default: pkg.Button }))),
      Input: lazy(() => import('antd').then(pkg => ({ default: pkg.Input }))),
      Select: lazy(() => import('antd').then(pkg => ({ default: pkg.Select }))),
      Avatar: lazy(() => import('antd').then(pkg => ({ default: pkg.Avatar }))),
    },
    '@ant-design/pro-table': {
      ProTable: lazy(() => import('@ant-design/pro-table').then(pkg => ({ default: pkg.ProTable })))
    },
    app: {
      Profile: lazy(() => import('./components/Profile').then(pkg => ({ default: pkg.default }))),
      FormContainer: lazy(() => import('./components/FormComponent').then(pkg => ({ default: pkg.FormContainer }))),
      InputFormItem: lazy(() => import('./components/FormComponent').then(pkg => ({ default: pkg.InputFormItem }))),
      SelectFormItem: lazy(() => import('./components/FormComponent').then(pkg => ({ default: pkg.SelectFormItem }))),
      DateFormItem: lazy(() => import('./components/FormComponent').then(pkg => ({ default: pkg.DateFormItem }))),
      PhoneFormItem: lazy(() => import('./components/FormComponent').then(pkg => ({ default: pkg.PhoneFormItem }))),
      EmailFormItem: lazy(() => import('./components/FormComponent').then(pkg => ({ default: pkg.EmailFormItem }))),
      MultiDetailFormItem: lazy(() => import('./components/FormComponent').then(pkg => ({ default: pkg.MultiDetailFormItem }))),
    },
  }
});

export default App;
