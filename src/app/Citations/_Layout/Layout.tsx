import React from 'react';
import { LayoutBody, PageLayout, SectionHeader } from '@tapis/tapisui-common';
import Citations from '../_components';
import styles from './Layout.module.scss';

const Layout: React.FC = () => {
  const header = (
    <>
      <SectionHeader className={styles['header']}>
        <div className={styles['header-title']}>C-MAIKI Gateway</div>
      </SectionHeader>
      <SectionHeader>
        <span className={styles['citations']}>
          Citations & Acknowledgements
        </span>
      </SectionHeader>
    </>
  );

  const body = (
    <div className={styles['body-wrapper']}>
      <LayoutBody>
        <Citations />
      </LayoutBody>
    </div>
  );

  return <PageLayout top={header} right={body} />;
};

export default Layout;
