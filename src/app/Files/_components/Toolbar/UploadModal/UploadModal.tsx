import { useEffect, useState, useCallback, useReducer } from 'react';
import { Button } from 'reactstrap';
import { GenericModal } from '@tapis/tapisui-common';
import { SubmitWrapper } from '@tapis/tapisui-common';
import { ToolbarModalProps } from '../Toolbar';
import { Files as Hooks } from '@tapis/tapisui-hooks';
import { focusManager } from 'react-query';
import { useDropzone } from 'react-dropzone';
import styles from './UploadModal.module.scss';
import { FileListingTable } from '@tapis/tapisui-common';
import { Files } from '@tapis/tapis-typescript';
// Unable to because of dependency issues
// Instead need to type infer GridColDef from FileListingTable

// import { GridColDef } from '@mui/x-data-grid';
import sizeFormat from 'utils/sizeFormat';
import { useFileOperations } from '../_hooks';
import { Progress } from '@tapis/tapisui-common';
import { FileOpEventStatusEnum } from '../_hooks/useFileOperations';
import { FileOperationStatus } from '../_components';

export enum FileOpEventStatus {
  loading = 'loading',
  progress = 'progress',
  error = 'error',
  success = 'success',
  none = 'none',
}

// CompatibleGridColDef is an inferred type
// Used because of dependency issues between tapis packages and root packages
// Simplify once versions of mui-x-data-grid are unified
type FileListingTableProps = React.ComponentProps<typeof FileListingTable>;
type CompatibleGridColDef = NonNullable<
  FileListingTableProps['appendColumns']
>[number];

export type FileProgressState = {
  [name: string]: number;
};

type UploadModalProps = ToolbarModalProps & {
  maxFileSizeBytes?: number;
};

const UploadModal: React.FC<UploadModalProps> = ({
  toggle,
  path,
  systemId,
  maxFileSizeBytes = 524288000,
}) => {
  const [files, setFiles] = useState<Array<File>>([]);

  const reducer = (
    state: FileProgressState,
    action: { name: string; progress: number }
  ) => {
    const { name, progress } = action;
    return {
      ...state,
      [name]: progress,
    };
  };

  const [fileProgressState, dispatch] = useReducer(
    reducer,
    {} as FileProgressState
  );

  const onProgress = (uploadProgress: number, file: File) => {
    dispatch({
      name: file.name,
      progress: uploadProgress,
    });
  };

  const onDrop = useCallback(
    (selectedFiles: Array<File>) => {
      // Create an array of files unique File objects. This prevents
      // a user from trying to upload 2 or more of the same file.
      const uniqueFiles = selectedFiles.filter(
        (selectedFile) =>
          // The some function contains the selection logic for
          // the filter function. All files that have the same name
          // as any file in the uniqueFiles array or exceeds the max
          // file size will not be added to the final array.
          !files.some(
            (existingFile) =>
              existingFile.name === selectedFile.name ||
              selectedFile.size > maxFileSizeBytes
          )
      );

      setFiles([...files, ...uniqueFiles]);
    },
    [files, setFiles, maxFileSizeBytes]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
  });

  const removeFile = useCallback(
    (file: Files.FileInfo) => {
      setFiles([...files.filter((checkFile) => file.name !== checkFile.name)]);
    },
    [files, setFiles]
  );

  const { uploadAsync, reset } = Hooks.useUpload();

  const key = (params: Hooks.InsertHookParams) => params.file.name;
  const onComplete = useCallback(() => {
    focusManager.setFocused(true);
  }, []);

  const { state, run, isLoading, isSuccess, error } = useFileOperations<
    Hooks.InsertHookParams,
    Files.FileStringResponse
  >({
    fn: uploadAsync,
    key,
    onComplete,
  });

  useEffect(() => {
    reset();
  }, [reset, path]);

  const onSubmit = useCallback(() => {
    const operations: Array<Hooks.InsertHookParams> = files.map((file) => ({
      systemId: systemId!,
      path: (path! + '/').replace('//', '/'),
      file,
      progressCallback: onProgress,
    }));
    run(operations);
  }, [files, run, systemId, path]);

  const filesToFileInfo = (filesArr: Array<File>): Array<Files.FileInfo> => {
    return filesArr.map((file) => {
      return {
        name: file.name,
        size: file.size,
        type: Files.FileTypeEnum.File,
      };
    });
  };

  const statusColumn: Array<CompatibleGridColDef> = [
    {
      field: 'deleteStatus',
      headerName: '',
      // minWidth: 70,
      sortable: false,
      renderCell: (params) => {
        const file = params.row as Files.FileInfo;
        const status = state[file.name!]?.status;
        if (!status) {
          return (
            <span
              className={styles['remove-file']}
              onClick={() => {
                const fileToRemove = filesToFileInfo(files).find(
                  (f) => f.name === file.name
                );
                if (fileToRemove) {
                  removeFile(fileToRemove);
                }
              }}
            >
              &#x2715;
            </span>
          );
        }
        if (
          status === FileOpEventStatusEnum.loading &&
          fileProgressState[file.name!] !== undefined
        ) {
          return (
            <div className={styles['progress-bar-container']}>
              <Progress value={fileProgressState[file.name!]} />
            </div>
          );
        }
        return <FileOperationStatus status={status} />;
      },
    },
  ];

  return (
    <GenericModal
      toggle={toggle}
      title={`Upload files`}
      body={
        <div>
          {!(isLoading || isSuccess) && (
            <div
              aria-label="Dropzone"
              className={styles['file-dropzone']}
              {...getRootProps()}
            >
              <input aria-label="File Input" {...getInputProps()} />
              <Button aria-label="File Select">Select files</Button>
              <div>
                <p>or drag and drop</p>
                <b>Max file size: {sizeFormat(maxFileSizeBytes)}</b>
              </div>
            </div>
          )}
          <h3 className={styles['files-list-header']}>
            Uploading to {systemId}/{path}
          </h3>
          {error && <p className={styles['upload-error']}>{error.message}</p>}
          <div className={styles['files-list-container']}>
            <FileListingTable
              files={filesToFileInfo(files)}
              fields={['size']}
              appendColumns={statusColumn}
              className={styles['file-list-table']}
            />
          </div>
        </div>
      }
      footer={
        <SubmitWrapper
          isLoading={isLoading}
          error={error}
          success={isSuccess ? `Successfully uploaded files` : ''}
          reverse={true}
        >
          <Button
            color="primary"
            disabled={isLoading || isSuccess || !!error || files.length === 0}
            aria-label="Submit"
            onClick={onSubmit}
          >
            Upload ({files.length})
          </Button>
        </SubmitWrapper>
      }
    />
  );
};

export default UploadModal;
