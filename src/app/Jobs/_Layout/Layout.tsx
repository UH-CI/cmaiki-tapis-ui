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

const Layout: React.FC = () => {
  const location = useLocation();
  const isJobsPath = location.pathname === '/jobs';
  const header = (
    <SectionHeader>
      <span className={`${styles['Jobs']}`}>Jobs</span>
    </SectionHeader>
  );

  const body = (
    <LayoutBody>
      {isJobsPath ? (
        <div style={{ padding: '16px' }}>
          <div
            style={{ padding: '16px', margin: '8px', border: '1px #000000' }}
          >
            <SectionMessage type="info">
              View a job from the list.
            </SectionMessage>
            <br />
            <JobsTable />
          </div>
        </div>
      ) : (
        <Router />
      )}
    </LayoutBody>
  );

  return <PageLayout top={header} right={body} />;
};

export default Layout;
