import { useCallback, useState } from 'react';
import { Button } from 'reactstrap';
import { GenericModal, Breadcrumbs } from '@tapis/tapisui-common';
import { SubmitWrapper } from '@tapis/tapisui-common';
import { breadcrumbsFromPathname } from '@tapis/tapisui-common';
import { FileListingTable } from '@tapis/tapisui-common';
import { FileOperationStatus } from '../_components';
import { FileExplorer } from '@tapis/tapisui-common';
import { ToolbarModalProps } from '../Toolbar';
import { useLocation } from 'react-router-dom';
import { focusManager } from 'react-query';
import { Files as Hooks } from '@tapis/tapisui-hooks';
import { Files } from '@tapis/tapis-typescript';
// Unable to because of dependency issues
// Instead need to type infer GridColDef from FileListingTable

// import { GridColDef } from '@mui/x-data-grid';import styles from './MoveCopyModal.module.scss';
import { useFilesSelect } from '../../FilesContext';
import { useFileOperations } from '../_hooks';
import styles from '../DeleteModal/DeleteModal.module.scss';

// CompatibleGridColDef is an inferred type
// Used because of dependency issues between tapis packages and root packages
// Simplify once versions of mui-x-data-grid are unified
type FileListingTableProps = React.ComponentProps<typeof FileListingTable>;
type CompatibleGridColDef = NonNullable<
  FileListingTableProps['appendColumns']
>[number];

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
  const { pathname } = useLocation();
  const [destinationPath, setDestinationPath] = useState<string | null>(path);
  const { selectedFiles, unselect } = useFilesSelect();

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
  const statusColumns: Array<CompatibleGridColDef> = [
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
    <div className="row h-100">
      <div className="col-md-6 d-flex flex-column">
        {/* Table of selected files */}
        <div className={`${styles['col-header']}`}>
          {`${
            operation === Files.MoveCopyRequestOperationEnum.Copy
              ? 'Copying '
              : 'Moving '
          }`}
          {selectedFiles.length} files
        </div>
        <Breadcrumbs
          breadcrumbs={[
            ...breadcrumbsFromPathname(pathname)
              .splice(1)
              .map((fragment) => ({ text: fragment.text })),
          ]}
        />
        <div className={styles['nav-list']}>
          <FileListingTable
            files={selectedFiles}
            className={`${styles['file-list-origin']} `}
            fields={['size']}
            appendColumns={statusColumns}
          />
        </div>
      </div>
      <div className="col-md-6 d-flex flex-column">
        {/* Table of selected files */}
        <div className={`${styles['col-header']}`}>Destination</div>
        <FileExplorer
          systemId={systemId}
          path={path}
          onNavigate={onNavigate}
          fields={['size']}
          className={styles['file-list']}
        />
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
      toggle={toggle}
      title={`${opFormatted} Files`}
      size="xl"
      body={body}
      footer={footer}
    />
  );
};

export default MoveCopyModal;
