import React from "react";
import { AppsTable } from "../_components";
import { PageLayout, LayoutBody, LayoutHeader } from "tapis-ui/_common";
import { Router } from "../_Router";
import { useLocation } from "react-router-dom";

const Layout: React.FC = () => {
  const location = useLocation();
  const isAppsPath = location.pathname === "/apps";

  const header = (
    <LayoutHeader>
      <div>Application Workflows</div>
    </LayoutHeader>
  );

  const body = (
    <LayoutBody>
      <Router />
      <br />
      {isAppsPath && <AppsTable />}
    </LayoutBody>
  );

  return <PageLayout top={header} center={body} />;
};

export default Layout;
