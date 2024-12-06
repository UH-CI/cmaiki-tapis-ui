import React from 'react';
import { JobsNav } from '../_components';
import { Router } from '../_Router';
import {
  PageLayout,
  LayoutBody,
  LayoutNavWrapper,
  SectionHeader,
  SectionMessage,
} from '@tapis/tapisui-common';
import { useLocation } from 'react-router-dom';
import styles from './Layout.module.scss';
import { JobsTable } from '../_components';
import { AppsTable } from '../../Apps/_components';

const Layout: React.FC = () => {
  const location = useLocation();
  const isJobsPath = location.pathname === '/jobs';
  const header = (
    <SectionHeader>
      <span className={`${styles['Jobs']}`}>Jobs</span>
    </SectionHeader>
  );

  const body = (
    <div
      style={{
        margin: '1rem 1rem 0 1rem',
        border: '1px solid #888888',
      }}
    >
      <LayoutBody>
        <Router />
        {isJobsPath && <JobsTable />}
      </LayoutBody>
    </div>
  );
  return <PageLayout top={header} right={body} />;
};

export default Layout;
