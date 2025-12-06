import React from 'react';
import { LayoutBody, PageLayout, SectionHeader } from '@tapis/tapisui-common';
import Projects from '../_components';
import { useLocation } from 'react-router-dom';
import styles from './Layout.module.scss';
import { Router } from '../_Router';

const Layout: React.FC = () => {
  const location = useLocation();
  const isProjectsPath = location.pathname === '/projects';

  const header = (
    <>
      <SectionHeader className={styles['header']}>
        <div style={{ marginLeft: '1.2rem', fontWeight: 'bolder' }}>
          C-MAIKI Gateway
        </div>
      </SectionHeader>
      <SectionHeader>
        <span className={styles['projects']}>Projects</span>
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
        {isProjectsPath && <Projects />}
      </LayoutBody>
    </div>
  );

  return <PageLayout top={header} right={body} />;
};

export default Layout;
