import Layout from "./Layout";
import { lazy } from 'react';

const Home = lazy(() => import('../pages/Home').then(pkg => ({ default: pkg.default })))
const Demo = lazy(() => import('../pages/Demo').then(pkg => ({ default: pkg.default })))

const routes = [
  {
    path: '/home',
    element: <Home />,
  },
  {
    path: '/layout',
    element: <Layout />,
    children: [{
      path: 'groot',
      children: [{ path: '*', element: <Demo /> }]
    }]
  },
  // {
  //   path: '/groot',
  //   children: [{ path: '*', element: <Demo /> }]
  // },
  {
    path: '*',
    element: <NoMatch />
  }
];

function NoMatch() {
  return (<>not found</>)
}

export default routes;