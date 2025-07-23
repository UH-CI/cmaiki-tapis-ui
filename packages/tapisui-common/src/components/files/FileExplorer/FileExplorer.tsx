import { useCallback, useState } from 'react';
import { Systems, Files } from '@tapis/tapis-typescript';
import { FileListing } from '../../files/FileListing';
import {
  // OnNavigateCallback,
  OnSelectCallback,
  SelectMode,
} from '../../files/FileListing/FileListing';
import { SystemListing } from '../../systems';
// import normalize from 'normalize-path';
import styles from './FileExplorer.module.scss';

type FileExplorerProps = {
  systemId?: string;
  path?: string;
  className?: string;
  allowSystemChange?: boolean;
  onNavigate?: (systemId: string | null, path: string | null) => void;
  onSelect?: OnSelectCallback;
  onUnselect?: OnSelectCallback;
  fields?: Array<'size' | 'lastModified'>;
  selectedFiles?: Array<Files.FileInfo>;
  selectMode?: SelectMode;
};

const FileExplorer: React.FC<FileExplorerProps> = ({
  systemId,
  path,
  className,
  // allowSystemChange,
  onNavigate,
  onSelect,
  onUnselect,
  fields = ['size'],
  selectedFiles,
  selectMode,
}) => {
  const [currentSystem, setCurrentSystem] = useState(systemId);
  // const [currentPath, setCurrentPath] = useState(path);

  // const onFileNavigate = useCallback<OnNavigateCallback>(
  //   (file) => {
  //     const newPath = normalize(`${currentPath}/${file.name!}`);
  //     setCurrentPath(newPath);
  //     onNavigate && onNavigate(currentSystem ?? null, newPath);
  //   },
  //   [setCurrentPath, currentPath, onNavigate, currentSystem]
  // );

  const onSystemNavigate = useCallback(
    (system: Systems.TapisSystem | null) => {
      if (!system) {
        onNavigate && onNavigate(null, null);
      }
      setCurrentSystem(system?.id);
      // setCurrentPath('/');
      onNavigate && onNavigate(system?.id ?? null, '/');
    },
    [setCurrentSystem, onNavigate]
  );

  return (
    <div className={className}>
      <div>
        {currentSystem ? (
          <FileListing
            className={`${styles['nav-list']}`}
            systemId={currentSystem}
            path={path ?? '/'}
            onNavigate={(file) => onNavigate?.(currentSystem, file.path ?? '/')}
            onSelect={onSelect}
            onUnselect={onUnselect}
            selectedFiles={selectedFiles}
            fields={fields}
            selectMode={selectMode}
          />
        ) : (
          <SystemListing
            className={`${styles['nav-list']}`}
            onNavigate={onSystemNavigate}
          />
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
