import { useEffect, useCallback } from 'react';
import { Button } from 'reactstrap';
import { GenericModal } from '@tapis/tapisui-common';
import { SubmitWrapper } from '@tapis/tapisui-common';
import { FileListingTable } from '@tapis/tapisui-common';
import { ToolbarModalProps } from '../Toolbar';
import { focusManager } from 'react-query';
import { Files as Hooks } from '@tapis/tapisui-hooks';
import { GridColDef } from '@mui/x-data-grid';
import styles from './DeleteModal.module.scss';
import { useFilesSelect } from '../../FilesContext';
import { Files } from '@tapis/tapis-typescript';
import { useFileOperations } from '../_hooks';
import { FileOperationStatus } from '../_components';

type DeleteHookParams = {
  systemId: string;
  path: string;
};

const DeleteModal: React.FC<ToolbarModalProps> = ({
  toggle,
  systemId = '',
  path = '/',
}) => {
  const { selectedFiles, unselect } = useFilesSelect();
  const { deleteFileAsync, reset } = Hooks.useDelete();

  useEffect(() => {
    reset();
  }, [reset]);

  const onComplete = useCallback(() => {
    // Calling the focus manager triggers react-query's
    // automatic refetch on window focus
    focusManager.setFocused(true);
  }, []);

  const { run, state, isLoading, isSuccess, error } = useFileOperations<
    DeleteHookParams,
    Files.FileStringResponse
  >({
    fn: deleteFileAsync,
    onComplete,
  });

  const onSubmit = useCallback(() => {
    const operations: Array<DeleteHookParams> = selectedFiles.map((file) => ({
      systemId,
      path: file.path!,
    }));
    run(operations);
  }, [selectedFiles, run, systemId]);

  const removeFile = useCallback(
    (file: Files.FileInfo) => {
      unselect([file]);
      if (selectedFiles.length === 1) {
        toggle();
      }
    },
    [selectedFiles, toggle, unselect]
  );

  // CompatibleGridColDef is an inferred type
  const statusColumn: Array<GridColDef> = [
    {
      field: 'deleteStatus',
      headerName: 'Undo',
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

  return (
    <GenericModal
      size="lg"
      toggle={() => {
        toggle();
        unselect(selectedFiles);
      }}
      title={`Delete files and folders`}
      body={
        <div>
          <h2>{path}</h2>
          <div className={styles['files-list-container']}>
            <FileListingTable
              files={selectedFiles}
              fields={['size']}
              appendColumns={statusColumn}
              className={styles['file-list-table']}
              selectMode={{ mode: 'none' }}
            />
          </div>
        </div>
      }
      footer={
        <SubmitWrapper
          isLoading={false}
          error={error}
          success={isSuccess ? `Successfully deleted files` : ''}
          reverse={true}
        >
          <Button
            color="primary"
            disabled={isLoading || isSuccess || selectedFiles.length === 0}
            aria-label="Submit"
            onClick={onSubmit}
          >
            Confirm delete ({selectedFiles.length})
          </Button>
          {!isSuccess && (
            <Button
              color="danger"
              disabled={isLoading || isSuccess || selectedFiles.length === 0}
              aria-label="Cancel"
              onClick={() => {
                toggle();
              }}
            >
              Cancel
            </Button>
          )}
        </SubmitWrapper>
      }
    />
  );
};

export default DeleteModal;
