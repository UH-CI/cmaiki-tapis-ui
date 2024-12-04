import React from "react";
import { AppsNav } from "../_components";
import { AppsTable } from "../_components";
import {
  PageLayout,
  LayoutBody,
  LayoutHeader,
  LayoutNavWrapper,
} from "@tapis/tapisui-common";
import AppsToolbar from "../_components/AppsToolbar";
import { useLocation } from "react-router-dom";

import { Router } from "../_Router";
// import AppsHelp from "app/_components/Help/AppsHelp";

const Layout: React.FC = () => {
  const location = useLocation();
  const isAppsPath = location.pathname === "/apps";
  const header = (
    <LayoutHeader>
      <span>Apps</span>
      <AppsToolbar />
    </LayoutHeader>
  );

  const body = (
    <div
      style={{
        margin: "1rem 1rem 0 1rem",
        // padding: "0 1rem 0 1rem",
        border: "1px solid #888888",
      }}
    >
      <LayoutBody>
        <Router />
        {isAppsPath && <AppsTable />}
      </LayoutBody>
    </div>
  );

  return <PageLayout top={header} right={body} />;
};

export default Layout;
