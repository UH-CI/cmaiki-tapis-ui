import React, { useCallback, useState } from 'react';
import { Button } from 'reactstrap';
import { GenericModal, SubmitWrapper } from '@tapis/tapisui-common';
import { FileExplorer } from '@tapis/tapisui-common';
import { Files as Hooks } from '@tapis/tapisui-hooks';
import { Progress } from '@tapis/tapisui-common';
// import normalize from 'normalize-path';
import styles from './ProjectUploadModal.module.scss';

interface ProjectUploadModalProps {
  open: boolean;
  onClose: () => void;
  xlsxBlob: Blob | null;
}

const ProjectUploadModal: React.FC<ProjectUploadModalProps> = ({
  open,
  onClose,
  xlsxBlob,
}) => {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('/');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);

  const { uploadAsync, reset } = Hooks.useUpload();

  const fileExplorerNavigateCallback = useCallback(
    (systemId: string | null, path: string | null) => {
      setSelectedSystem(systemId);
      setSelectedPath(path || '/');
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (!selectedSystem || !xlsxBlob) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Extract filename from blob or use default
      const fileName = (xlsxBlob as any).__filename || 'metadata.xlsx';

      // Convert Blob to File
      const file = new File([xlsxBlob], fileName, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const uploadPath = selectedPath.endsWith('/')
        ? selectedPath
        : `${selectedPath}/`;

      await uploadAsync({
        systemId: selectedSystem,
        path: uploadPath,
        file,
        progressCallback: (progress: number) => {
          setUploadProgress(progress);
        },
      });

      setUploadSuccess(true);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error as Error);
    } finally {
      setIsUploading(false);
    }
  }, [selectedSystem, selectedPath, xlsxBlob, uploadAsync]);

  const handleClose = useCallback(() => {
    reset();
    setSelectedSystem(null);
    setSelectedPath('/');
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadError(null);
    setIsUploading(false);
    onClose();
  }, [onClose, reset]);

  if (!open) {
    return null;
  }

  const body = !uploadSuccess ? (
    <FileExplorer
      allowSystemChange={true}
      systemId={selectedSystem ?? undefined}
      path={selectedPath}
      onNavigate={fileExplorerNavigateCallback}
      fields={['size', 'lastModified']}
      className={styles['file-explorer']}
    />
  ) : (
    <div className={styles['upload-status']}>
      <h3>
        Uploading to {selectedSystem}/{selectedPath}
      </h3>
      <p>File: {(xlsxBlob as any).__filename || 'metadata.xlsx'}</p>
      {isUploading && (
        <div className={styles['progress-container']}>
          <Progress value={uploadProgress} />
        </div>
      )}
    </div>
  );

  const footer = (
    <SubmitWrapper
      isLoading={isUploading}
      error={uploadError}
      success={uploadSuccess ? 'Successfully uploaded metadata file' : ''}
      reverse={true}
    >
      <Button color="secondary" onClick={handleClose} disabled={isUploading}>
        Cancel
      </Button>
      {!uploadSuccess && (
        <Button
          disabled={!selectedSystem || isUploading}
          color="primary"
          onClick={handleUpload}
          data-testid="uploadButton"
        >
          Upload to Current Directory
        </Button>
      )}
    </SubmitWrapper>
  );

  return (
    <GenericModal
      toggle={handleClose}
      title="Select directory for metadata upload"
      size="lg"
      body={body}
      footer={footer}
      className={styles['project-upload-modal']}
    />
  );
};

export default ProjectUploadModal;
