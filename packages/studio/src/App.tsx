import { LocalAPIPath } from "api/API.path";
import Login from "Login";
import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Studio from "./Studio";
import request from "util/request";

// 处理布局和路由，加载账户信息包括组织架构
const App: React.FC = () => {
  const [account, setAccount] = useState<any>();
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/auth') return

    request(LocalAPIPath.account).then(() => {
      setAccount({});
    })
  }, []);

  return <Routes>
    <Route index element={<Studio.Wrapper account={account} />} />
    <Route path="auth" element={<Login />} />
  </Routes>

}

export default App;