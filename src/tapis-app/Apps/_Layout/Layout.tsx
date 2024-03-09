import React from "react";
import { AppsNav, AppsTable } from "../_components";
import {
  PageLayout,
  LayoutBody,
  LayoutHeader,
  // LayoutNavWrapper,
} from "tapis-ui/_common";

import { Router } from "../_Router";

const Layout: React.FC = () => {
  const header = (
    <LayoutHeader>
      <div>Application Workflows</div>
    </LayoutHeader>
  );

  // const sidebar = (
  //   <LayoutNavWrapper>
  //     <AppsNav />
  //   </LayoutNavWrapper>
  // );

  const body = (
    <LayoutBody>
      <Router />
      {/*<AppsNav />*/}
      <AppsTable />
    </LayoutBody>
  );

  // return <PageLayout top={header} left={sidebar} right={body} />;
  return <PageLayout top={header} center={body} />;
};

export default Layout;
