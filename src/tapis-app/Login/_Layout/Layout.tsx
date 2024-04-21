import React from "react";
import { Redirect, useLocation } from "react-router-dom";
import { Location } from "history";
import { Login as TapisLogin } from "../_components";
import { useTapisConfig } from "tapis-hooks";

const Layout: React.FC = () => {
  const { accessToken } = useTapisConfig();
  let location = useLocation<{ from: Location }>();
  let { from } = location.state || { from: { pathname: "/" } };

  if (accessToken?.access_token) {
    return <Redirect to={from} />;
  }

  return (
    <div>
      <div className="container">
        <TapisLogin />
      </div>
    </div>
  );
};

export default Layout;
