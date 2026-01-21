import React, { useContext } from 'react';
import {
  PageLayout,
  LayoutBody,
  LayoutHeader,
  LayoutNavWrapper,
  Breadcrumbs,
  SectionHeader,
} from '@tapis/tapisui-common';
import { SystemsNav } from '../_components';
import { Router } from '../_Router';
import Toolbar from '../_components/Toolbar';
import { useLocation } from 'react-router-dom';
// import { breadcrumbsFromPathname } from '@tapis/tapisui-common';
import styles from './Layout.module.scss';
import { FilesProvider, FilesContext } from '../_components/FilesContext';
// import FilesHelp from 'app/_components/Help/FilesHelp';

// Wrapper component that can access FilesContext for the current path
const ToolbarWrapper: React.FC<{ systemId: string }> = ({ systemId }) => {
  const { currentPath } = useContext(FilesContext);
  return <Toolbar systemId={systemId} currentPath={currentPath} />;
};

const LayoutContent: React.FC = () => {
  const { pathname } = useLocation();
  const systemId = pathname.split('/')[2];
  // const crumbs = breadcrumbsFromPathname(pathname).splice(1);
  const header = (
    <>
      <SectionHeader className={styles.header}>
        <div style={{ marginLeft: '1.2rem', fontWeight: 'bolder' }}>
          C-MAIKI Gateway
          {/*Dashboard for {claims['tapis/tenant_id']}*/}
        </div>
      </SectionHeader>
      <LayoutHeader>
        <span className={`${styles['Files']}`}>
          Files
          {/*<span className={`${styles['Files-Help']}`}>*/}
          {/*  <FilesHelp />*/}
          {/*</span>*/}
        </span>
        {/* <div className={styles.breadcrumbs}>

        <Breadcrumbs breadcrumbs={[{ text: 'Files' }, ...crumbs]} />
      </div> */}
        {systemId && <ToolbarWrapper systemId={systemId} />}
      </LayoutHeader>
    </>
  );

  const sidebar = (
    <LayoutNavWrapper>
      <SystemsNav />
    </LayoutNavWrapper>
  );

  const body = (
    <LayoutBody constrain>
      <Router />
    </LayoutBody>
  );

  return <PageLayout top={header} left={sidebar} right={body} />;
};

const Layout: React.FC = () => {
  return (
    <FilesProvider>
      <LayoutContent />
    </FilesProvider>
  );
};

export default Layout;
