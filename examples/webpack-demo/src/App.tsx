import { useRoutes } from 'react-router-dom';
import routes from './config/routes';
import { Avatar, Button, Input, Select } from 'antd';
import { ProTable } from '@ant-design/pro-table';
import react from 'react';
import Profile from 'components/Profile';
import { DateFormItem, EmailFormItem, FormContainer, InputFormItem, MultiDetailFormItem, PhoneFormItem, SelectFormItem } from 'components/FormComponent';
import { UIManager } from '@grootio/react';


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
      Button,
      Input,
      Select,
      Avatar
    },
    '@ant-design/pro-table': {
      ProTable
    },
    app: {
      Profile,
      FormContainer,
      InputFormItem,
      SelectFormItem,
      DateFormItem,
      PhoneFormItem,
      EmailFormItem,
      MultiDetailFormItem
    },
  }
});

export default App;
