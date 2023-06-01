import Demo from "pages/Demo";
import Home from "pages/Home";
import Layout from "./Layout";

const routes = [
  {
    path: '/',
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