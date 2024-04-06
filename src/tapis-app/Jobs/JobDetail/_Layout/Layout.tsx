import React from "react";
import { JobDetail } from "tapis-ui/components/jobs";
import { PageLayout, LayoutHeader } from "tapis-ui/_common";
import { Link } from "react-router-dom";
// import styles from "./Layout.module.scss";

interface JobDetailProps {
  jobUuid: string;
}

const Layout: React.FC<JobDetailProps> = ({ jobUuid }) => {
  const header = (
    <LayoutHeader type={"sub-header"}>
      Job Details<Link to="/jobs">Return to Jobs</Link>{" "}
    </LayoutHeader>
  );

  const body = (
    <div style={{ flex: 1 }}>
      <JobDetail jobUuid={jobUuid}></JobDetail>
      {/*Floating button for return to jobs to replace header link*/}
      {/*<Link to="/jobs" className={styles["floating-button"]}>*/}
      {/*  Return to Jobs*/}
      {/*</Link>*/}
    </div>
  );
  return <PageLayout top={header} right={body}></PageLayout>;
};

export default Layout;
