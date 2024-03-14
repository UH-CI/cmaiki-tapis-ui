import React from "react";
import { Link } from "react-router-dom";
import { JobLauncher } from "tapis-ui/components/jobs";
import { PageLayout, LayoutHeader } from "tapis-ui/_common";

const Layout: React.FC<{ appId: string; appVersion: string }> = ({
  appId,
  appVersion,
}) => {
  const header = (
    <LayoutHeader type={"sub-header"}>
      Job Launcher
      <Link to="/apps">Return to Apps</Link>{" "}
    </LayoutHeader>
  );
  const body = (
    <div style={{ flex: 1 }}>
      <JobLauncher appId={appId} appVersion={appVersion} />
    </div>
  );

  return <PageLayout top={header} right={body} />;
};

export default React.memo(Layout);
