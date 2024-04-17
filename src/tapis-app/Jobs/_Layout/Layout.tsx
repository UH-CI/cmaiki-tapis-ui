import React from "react";
import { JobsTable } from "../_components";
import { Router } from "../_Router";
import {
  PageLayout,
  LayoutBody,
  LayoutHeader,
  SectionMessage,
} from "tapis-ui/_common";
import { useLocation } from "react-router-dom";

const Layout: React.FC = () => {
  const location = useLocation();
  const isJobsPath = location.pathname === "/jobs";

  const header = (
    <LayoutHeader>
      <div>Jobs</div>
    </LayoutHeader>
  );

  const body = (
    <LayoutBody>
      {isJobsPath ? (
        <>
          <SectionMessage type="info">View a job from the list.</SectionMessage>
          <br />
          <JobsTable />
        </>
      ) : (
        <Router />
      )}
    </LayoutBody>
  );

  return <PageLayout top={header} center={body} />;
};

export default Layout;
