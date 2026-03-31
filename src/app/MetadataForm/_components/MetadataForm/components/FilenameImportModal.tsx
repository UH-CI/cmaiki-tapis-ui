import React, { useState, useCallback, useMemo } from 'react';
import { Button } from 'reactstrap';
import { Files as Hooks } from '@tapis/tapisui-hooks';
import FileModal from './FileModal';
import { parseFileNames } from '../hooks/useFileNameParser';

interface FilenameImportModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (sampNames: string[]) => void;
}

const FilenameImportModal: React.FC<FilenameImportModalProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState('/');

  // Fetch file listing in the background as the user navigates.
  const { concatenatedResults, isLoading } = Hooks.useList(
    { systemId: selectedSystem ?? '', path: selectedPath },
    { enabled: !!selectedSystem }
  );

  const parsedNames = useMemo(() => {
    if (!concatenatedResults) return null;
    return parseFileNames(concatenatedResults).map((s) => s.sampName);
  }, [concatenatedResults]);

  const handleNavigate = useCallback(
    (systemId: string | null, path: string) => {
      setSelectedSystem(systemId);
      setSelectedPath(path);
    },
    []
  );

  const handleConfirm = useCallback(() => {
    if (parsedNames) {
      onConfirm(parsedNames);
    }
    onClose();
  }, [parsedNames, onConfirm, onClose]);

  const count = parsedNames?.length ?? 0;
  const ready = !!selectedSystem && !isLoading && parsedNames !== null;

  return (
    <FileModal
      open={open}
      onClose={onClose}
      title="Select directory containing sequencing files"
      onNavigate={handleNavigate}
      renderFooter={() => (
        <Button
          color="primary"
          disabled={!ready || count === 0}
          onClick={handleConfirm}
        >
          {isLoading
            ? 'Scanning…'
            : `Import ${count} sample name${count !== 1 ? 's' : ''}`}
        </Button>
      )}
    />
  );
};

export default FilenameImportModal;
