import React, { useState, useCallback } from 'react';
import { GenericModal } from '@tapis/tapisui-common';
import { FileExplorer } from '@tapis/tapisui-common';
import styles from './FileModal.module.scss';

export interface FileModalFooterParams {
  systemId: string | null;
  path: string;
}

interface FileModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  renderFooter: (params: FileModalFooterParams) => React.ReactNode;
  bodyOverride?: React.ReactNode;
  onNavigate?: (systemId: string | null, path: string) => void;
}

// Reusable modal that wraps a FileExplorer for directory navigation
const FileModal: React.FC<FileModalProps> = ({
  open,
  onClose,
  title,
  renderFooter,
  bodyOverride,
  onNavigate,
}) => {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('/');

  const handleNavigate = useCallback(
    (systemId: string | null, path: string | null) => {
      const normalizedPath = path || '/';
      setSelectedSystem(systemId);
      setSelectedPath(normalizedPath);
      onNavigate?.(systemId, normalizedPath);
    },
    [onNavigate]
  );

  if (!open) return null;

  const body = bodyOverride ?? (
    <FileExplorer
      allowSystemChange={true}
      systemId={selectedSystem ?? undefined}
      path={selectedPath}
      onNavigate={handleNavigate}
      fields={['size', 'lastModified']}
      className={styles['file-explorer']}
    />
  );

  return (
    <GenericModal
      toggle={onClose}
      title={title}
      size="lg"
      body={body}
      footer={renderFooter({ systemId: selectedSystem, path: selectedPath })}
      className={styles['file-modal']}
    />
  );
};

export default FileModal;
