
import App from "./App";

// import 'antd/dist/reset.css';
import './index.less'

type PropsType = {
  appEnv: string,
  appName: string,
  rootId: string,
}

const Main: React.FC<PropsType> = () => {

  return <App />

}


export default Main;