import React, { useCallback, useState } from 'react';
import { Button } from 'reactstrap';
import { SubmitWrapper } from '@tapis/tapisui-common';
import { Files as Hooks } from '@tapis/tapisui-hooks';
import { Files } from '@tapis/tapis-typescript';
import { Progress } from '@tapis/tapisui-common';
import FileModal from './FileModal';
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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);
  // Store the confirmed system/path so they're available in the success body
  const [uploadTarget, setUploadTarget] = useState<{
    systemId: string;
    path: string;
  } | null>(null);

  const { uploadAsync, reset } = Hooks.useUpload();
  const { nativeOpAsync } = Hooks.useNativeOp();

  const handleUpload = useCallback(
    async (systemId: string, path: string) => {
      if (!xlsxBlob) return;

      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);
      setUploadTarget({ systemId, path });

      try {
        const fileName = (xlsxBlob as any).__filename || 'metadata.xlsx';
        const file = new File([xlsxBlob], fileName, {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const uploadPath = path.endsWith('/') ? path : `${path}/`;

        await uploadAsync({
          systemId,
          path: uploadPath,
          file,
          progressCallback: (progress: number) => {
            setUploadProgress(progress);
          },
        });

        try {
          await nativeOpAsync({
            systemId,
            path: `${uploadPath}${fileName}`,
            recursive: false,
            operation: Files.NativeLinuxOpRequestOperationEnum.Chmod,
            argument: '444',
          });
        } catch (chmodError) {
          console.warn('Failed to make file read-only:', chmodError);
        }

        setUploadSuccess(true);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadError(error as Error);
      } finally {
        setIsUploading(false);
      }
    },
    [xlsxBlob, uploadAsync, nativeOpAsync]
  );

  const handleClose = useCallback(() => {
    reset();
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadError(null);
    setIsUploading(false);
    setUploadTarget(null);
    onClose();
  }, [onClose, reset]);

  const uploadStatusBody = uploadTarget && (
    <div className={styles['upload-status']}>
      <h3>
        Uploading to {uploadTarget.systemId}/{uploadTarget.path}
      </h3>
      <p>File: {(xlsxBlob as any)?.__filename || 'metadata.xlsx'}</p>
      {isUploading && (
        <div className={styles['progress-container']}>
          <Progress value={uploadProgress} />
        </div>
      )}
    </div>
  );

  return (
    <FileModal
      open={open}
      onClose={handleClose}
      title="Select directory for metadata upload"
      bodyOverride={uploadSuccess ? uploadStatusBody : undefined}
      renderFooter={({ systemId, path }) => (
        <SubmitWrapper
          isLoading={isUploading}
          error={uploadError}
          success={uploadSuccess ? 'Successfully uploaded metadata file' : ''}
          reverse={true}
        >
          <Button
            color="secondary"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          {!uploadSuccess && (
            <Button
              disabled={!systemId || isUploading}
              color="primary"
              onClick={() => systemId && handleUpload(systemId, path)}
              data-testid="uploadButton"
            >
              Upload to Current Directory
            </Button>
          )}
        </SubmitWrapper>
      )}
    />
  );
};

export default ProjectUploadModal;
