import React from 'react';
import { LayoutHeader, PageLayout } from '@tapis/tapisui-common';
import ProjectsNav from '../_components/ProjectsNav';
import ProjectsToolbar from '../_components/ProjectsToolbar';
import { Router } from '../_Router';
import styles from './Layout.module.scss';

const Layout: React.FC = () => (
  <PageLayout
    top={
      <LayoutHeader>
        <span>Projects</span>
        <ProjectsToolbar />
      </LayoutHeader>
    }
    left={
      <div className={styles.container}>
        <ProjectsNav />
      </div>
    }
    right={<Router />}
  />
);

export default Layout;
