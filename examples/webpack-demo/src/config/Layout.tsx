import { UIManager } from "@grootio/react";
import { Link, Outlet, useLocation } from "react-router-dom";

function Layout() {
  const location = useLocation();

  return (
    <>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          {/* <li>
            <Link to="/layout/groot/button">button</Link>
          </li> */}
          <li>
            <Link to="/layout/groot/table">table</Link>
          </li>
          <li>
            <Link to="/layout/groot/profile">profile</Link>
          </li>
        </ul>
      </nav>

      <hr />

      <Outlet />

      {/* {location.pathname === '/layout/groot/table' || location.pathname === '/layout/groot/profile' ? <UIManager viewKey="/layout/groot/button" /> : null} */}
    </>
  )
}

export default Layout;