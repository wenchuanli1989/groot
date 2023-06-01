import { UIManager } from '@grootio/react';
import { useLocation } from 'react-router';


// UIManager.init({
//   appKey: 'demo',
//   appEnv: 'dev',
//   serverUrl: 'http://groot-local.com:10000',
//   debug: true,
//   modules: {
//     react,
//     antd: {
//       Button,
//       Input,
//       Select,
//       Avatar
//     },
//     '@ant-design/pro-table': {
//       ProTable
//     },
//     app: {
//       Profile,
//       FormContainer,
//       InputFormItem,
//       SelectFormItem,
//       DateFormItem,
//       PhoneFormItem,
//       EmailFormItem,
//       MultiDetailFormItem
//     },
//   }
// });

function Demo() {
  const location = useLocation();

  return (
    <>
      <UIManager viewKey={location.pathname} />
    </>
  );
}

export default Demo;
