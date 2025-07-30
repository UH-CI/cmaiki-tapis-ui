import { useCallback, useState } from 'react';
import { Button } from 'reactstrap';
import { GenericModal, Breadcrumbs } from '@tapis/tapisui-common';
import { SubmitWrapper } from '@tapis/tapisui-common';
// import { breadcrumbsFromPathname } from '@tapis/tapisui-common';
import { FileListingTable } from '@tapis/tapisui-common';
import { FileOperationStatus } from '../_components';
import { FileExplorer } from '@tapis/tapisui-common';
import { ToolbarModalProps } from '../Toolbar';
// import { useLocation } from 'react-router-dom';
import { focusManager } from 'react-query';
import { Files as Hooks } from '@tapis/tapisui-hooks';
import { Files } from '@tapis/tapis-typescript';
// Unable to because of dependency issues
// Instead need to type infer GridColDef from FileListingTable

import { GridColDef } from '@mui/x-data-grid';
import styles from './MoveCopyModal.module.scss';
import { useFilesSelect } from '../../FilesContext';
import { useFileOperations } from '../_hooks';

// CompatibleGridColDef is an inferred type
// Used because of dependency issues between tapis packages and root packages
// Simplify once versions of mui-x-data-grid are unified
// type FileListingTableProps = React.ComponentProps<typeof FileListingTable>;
// type CompatibleGridColDef = NonNullable<
//   FileListingTableProps['appendColumns']
// >[number];

type MoveCopyHookParams = {
  systemId: string;
  path: string;
  newPath: string;
};

type MoveCopyModalProps = {
  operation: Files.MoveCopyRequestOperationEnum;
} & ToolbarModalProps;

const MoveCopyModal: React.FC<MoveCopyModalProps> = ({
  toggle,
  systemId = '',
  path = '/',
  operation,
}) => {
  // const { pathname } = useLocation();
  const [destinationPath, setDestinationPath] = useState<string | null>(path);
  const { selectedFiles, unselect } = useFilesSelect();

  // Get the directory path from the first selected file
  const getDirectoryPath = useCallback(() => {
    if (selectedFiles.length === 0) return '/';

    const firstFilePath = selectedFiles[0].path || '/';
    const pathParts = firstFilePath.split('/');

    pathParts.pop();

    const directoryPath = pathParts.join('/');
    return directoryPath || '/';
  }, [selectedFiles]);

  const opFormatted = operation.charAt(0) + operation.toLowerCase().slice(1);

  const { copyAsync } = Hooks.useCopy();
  const { moveAsync } = Hooks.useMove();
  const fn =
    operation === Files.MoveCopyRequestOperationEnum.Copy
      ? copyAsync
      : moveAsync;

  const onComplete = useCallback(() => {
    // Calling the focus manager triggers react-query's
    // automatic refetch on window focus
    focusManager.setFocused(true);
  }, []);

  const onNavigate = useCallback(
    (_: string | null, path: string | null) => {
      setDestinationPath(path);
    },
    [setDestinationPath]
  );

  const removeFile = useCallback(
    (file: Files.FileInfo) => {
      unselect([file]);
      if (selectedFiles.length === 1) {
        toggle();
      }
    },
    [selectedFiles, toggle, unselect]
  );

  const { run, state, isLoading, isFinished, isSuccess, error } =
    useFileOperations<MoveCopyHookParams, Files.FileStringResponse>({
      fn,
      onComplete,
    });

  const onSubmit = useCallback(() => {
    const operations: Array<MoveCopyHookParams> = selectedFiles.map((file) => ({
      systemId,
      newPath: `${destinationPath!}/${file.name!}`,
      path: file.path!,
    }));
    run(operations);
  }, [selectedFiles, run, destinationPath, systemId]);

  // CompatibleGridColDef is an inferred type
  const statusColumns: Array<GridColDef> = [
    {
      field: 'moveCopyStatus',
      headerName: '',
      // minWidth: 70,
      sortable: false,
      renderCell: (params) => {
        // const file = selectedFiles[params.row.index];
        // Changed file search because MUI DataGrid doesn't guarantee the order
        // of rows will match original array order.
        const file = selectedFiles.find((f) => f.path === params.row.path);
        if (file && !state[file.path!]) {
          return (
            <span
              className={styles['remove-file']}
              onClick={() => {
                // removeFile(selectedFiles[params.row.index]);
                removeFile(file);
              }}
            >
              &#x2715;
            </span>
          );
        }
        return <FileOperationStatus status={state[file?.path!].status} />;
      },
    },
  ];

  const body = (
    <div>
      <div className={styles['modal-content']}>
        <div className={styles['left-panel']}>
          <div className={styles['panel-header']}>
            <div className={`${styles['col-header']}`}>
              {`${
                operation === Files.MoveCopyRequestOperationEnum.Copy
                  ? 'Copying '
                  : 'Moving '
              }`}
              {selectedFiles.length} files from:
            </div>
            <h3>{getDirectoryPath()}</h3>
          </div>
          <div className={styles['files-list-container']}>
            <FileListingTable
              files={selectedFiles}
              className={`${styles['file-list-origin']} `}
              fields={['size']}
              appendColumns={statusColumns}
              selectMode={{ mode: 'none' }}
            />
          </div>
        </div>
        <div className={styles['right-panel']}>
          <div className={styles['panel-header']}>
            <div className={`${styles['col-header']}`}>To:</div>
            <div className={styles['header-spacer']}></div>
          </div>
          <div className={styles['files-list-container']}>
            <FileExplorer
              systemId={systemId}
              path={path}
              onNavigate={onNavigate}
              fields={['size']}
              className={styles['file-list']}
              selectMode={{ mode: 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const footer = (
    <SubmitWrapper
      isLoading={isLoading}
      error={error}
      success={
        isSuccess
          ? 'Successfully ' +
            (operation === Files.MoveCopyRequestOperationEnum.Move
              ? 'moved'
              : 'copied') +
            ' files'
          : ''
      }
      reverse={true}
    >
      <Button
        color="primary"
        disabled={
          !destinationPath ||
          destinationPath === path ||
          isLoading ||
          (isFinished && !error)
        }
        aria-label="Submit"
        type="submit"
        onClick={onSubmit}
      >
        {opFormatted}
      </Button>
    </SubmitWrapper>
  );

  return (
    <GenericModal
      toggle={() => {
        toggle();
        unselect(selectedFiles);
      }}
      title={`${opFormatted} Files`}
      size="xl"
      body={body}
      footer={footer}
    />
  );
};

export default MoveCopyModal;
