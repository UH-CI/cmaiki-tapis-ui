import React from 'react';
import { AppsNav } from '../_components';
import { AppsTable } from '../_components';
import {
  PageLayout,
  LayoutBody,
  LayoutHeader,
  LayoutNavWrapper,
  SectionHeader,
} from '@tapis/tapisui-common';
import AppsToolbar from '../_components/AppsToolbar';
import { useLocation } from 'react-router-dom';

import { Router } from '../_Router';
import styles from './Layout.module.scss';
// import AppsHelp from "app/_components/Help/AppsHelp";

const Layout: React.FC = () => {
  const location = useLocation();
  const isAppsPath = location.pathname === '/apps';
  const header = (
    <>
      <SectionHeader className={styles.header}>
        <div style={{ marginLeft: '1.2rem', fontWeight: 'bolder' }}>
          C-MAIKI Gateway
          {/*Dashboard for {claims['tapis/tenant_id']}*/}
        </div>
      </SectionHeader>
      <SectionHeader>
        <span className={`${styles['Apps']}`}>Apps</span>
        {/*<AppsToolbar />*/}
      </SectionHeader>
    </>
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
        {isAppsPath && <AppsTable />}
      </LayoutBody>
    </div>

    // <LayoutBody>
    //   <div style={{ padding: "16px" }}>
    //     <div
    //       style={{
    //         padding: "16px",
    //         margin: "8px",
    //         border: "1px solid #888888",
    //       }}
    //     >
    //       <Router />
    //       {isAppsPath && <AppsTable />}
    //     </div>
    //   </div>
    // </LayoutBody>
  );

  return <PageLayout top={header} right={body} />;
};

export default Layout;
