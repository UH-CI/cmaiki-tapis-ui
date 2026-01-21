import React, { useContext, useEffect } from 'react';
import { FileListing } from '@tapis/tapisui-common';
import { PageLayout } from '@tapis/tapisui-common';
import {
  useFilesSelect,
  FilesContext,
} from 'app/Files/_components/FilesContext';
import styles from './Layout.module.scss';

type LayoutProps = {
  systemId: string;
  path: string;
  location: string;
};

const Layout: React.FC<LayoutProps> = ({ systemId, path, location }) => {
  const { selectedFiles, select, unselect, clear } = useFilesSelect();
  const { setCurrentPath } = useContext(FilesContext);

  // Set the current path from URL on initial load and when path prop changes
  useEffect(() => {
    setCurrentPath(path || '/');
    clear();
  }, [systemId, path, clear, setCurrentPath]);

  const handlePathChange = (newPath: string) => {
    setCurrentPath(newPath || '/');
    clear(); // Clear selections when path changes
  };

  const body = (
    <div className={styles.body}>
      <FileListing
        systemId={systemId}
        path={path}
        location={location}
        selectMode={{ mode: 'multi', types: ['dir', 'file'] }}
        selectedFiles={selectedFiles}
        onSelect={(files) => select(files, 'multi')}
        onUnselect={unselect}
        onPathChange={handlePathChange}
      ></FileListing>
    </div>
  );

  return <PageLayout right={body} constrain></PageLayout>;
};

export default Layout;
