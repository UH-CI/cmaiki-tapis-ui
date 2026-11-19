import React from 'react';
import {
  Redirect,
  Route,
  Switch,
  useHistory,
  useLocation,
  useRouteMatch,
} from 'react-router-dom';
import { Alert, Tab, Tabs } from '@mui/material';
import { LayoutHeader, PageLayout } from '@tapis/tapisui-common';
import ProjectsNav from '../../Projects/_components/ProjectsNav';
import ProjectsToolbar from '../../Projects/_components/ProjectsToolbar';
import { Router } from '../../Projects/_Router';
import RouteLoader from '../../_components/RouteLoader/RouteLoader';
import useAdminAccess from '../adminAccess';
import styles from '../../Projects/_Layout/Layout.module.scss';
import AdminRoleUsers from '../_components/AdminRoleUsers';
import AdminReports from '../_components/AdminReports';

const Admin: React.FC = () => {
  const { hasAccess, isLoading, error } = useAdminAccess();
  const { path, url } = useRouteMatch();
  const location = useLocation();
  const history = useHistory();
  const roleUsersPath = `${url}/roles`;
  const reportsPath = `${url}/reports`;
  const projectsPath = `${url}/projects`;
  const selectedTab = location.pathname.startsWith(roleUsersPath)
    ? 'roles'
    : location.pathname.startsWith(projectsPath)
    ? 'projects'
    : 'reports';

  if (isLoading) {
    return <RouteLoader message="Checking Admin access..." />;
  }

  if (error) {
    return (
      <Alert severity="error">
        Could not verify access to Admin: {error.message}
      </Alert>
    );
  }

  if (!hasAccess) {
    return <Redirect to="/" />;
  }

  return (
    <PageLayout
      top={
        <LayoutHeader>
          <span>Admin</span>
          <Tabs
            value={selectedTab}
            onChange={(_, tab: string) => history.push(`${url}/${tab}`)}
            aria-label="Admin subsections"
          >
            <Tab label="Project Summaries" value="reports" />
            <Tab label="Projects" value="projects" />
            <Tab label="Admin Role Users" value="roles" />
          </Tabs>
          {selectedTab === 'projects' && <ProjectsToolbar />}
        </LayoutHeader>
      }
      left={
        <Route path={`${path}/projects`}>
          <div className={styles.container}>
            <ProjectsNav />
          </div>
        </Route>
      }
      right={
        <Switch>
          <Route path={`${path}/projects`}>
            <Router />
          </Route>
          <Route exact path={`${path}/roles`}>
            <AdminRoleUsers />
          </Route>
          <Route exact path={`${path}/reports`}>
            <AdminReports projectBasePath={`${url}/projects`} />
          </Route>
          <Redirect to={reportsPath} />
        </Switch>
      }
    />
  );
};

export default Admin;
