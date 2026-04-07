import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from 'reactstrap';
import { Files as Hooks } from '@tapis/tapisui-hooks';
import { Files } from '@tapis/tapis-typescript';
import FileModal from './FileModal';
import { parseFileNames } from '../hooks/useFileNameParser';

interface FilenameImportModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (sampNames: string[]) => void;
}

interface SubdirFilesProps {
  systemId: string;
  path: string;
  onResult: (path: string, files: Files.FileInfo[], loading: boolean) => void;
}

const SubdirFiles: React.FC<SubdirFilesProps> = ({
  systemId,
  path,
  onResult,
}) => {
  const { concatenatedResults, isLoading } = Hooks.useList({ systemId, path });
  useEffect(() => {
    onResult(
      path,
      concatenatedResults?.filter((f) => f.type === 'file') ?? [],
      isLoading
    );
  }, [concatenatedResults, isLoading, path, onResult]);
  return null;
};

interface ScanTarget {
  system: string;
  path: string;
}

const FilenameImportModal: React.FC<FilenameImportModalProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState('/');
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);
  const [subdirFiles, setSubdirFiles] = useState<
    Record<string, Files.FileInfo[]>
  >({});
  const [subdirLoading, setSubdirLoading] = useState<Record<string, boolean>>(
    {}
  );

  const { concatenatedResults, isLoading } = Hooks.useList(
    { systemId: scanTarget?.system ?? '', path: scanTarget?.path ?? '' },
    { enabled: !!scanTarget }
  );

  const subdirs = useMemo(
    () => concatenatedResults?.filter((f) => f.type === 'dir' && f.path) ?? [],
    [concatenatedResults]
  );

  const handleSubdirResult = useCallback(
    (path: string, files: Files.FileInfo[], loading: boolean) => {
      setSubdirFiles((prev) => ({ ...prev, [path]: files }));
      setSubdirLoading((prev) => ({ ...prev, [path]: loading }));
    },
    []
  );

  useEffect(() => {
    setSubdirFiles({});
    setSubdirLoading({});
  }, [scanTarget]);

  const allFiles = useMemo(() => {
    if (!concatenatedResults) return null;
    const topLevel = concatenatedResults.filter((f) => f.type === 'file');
    const fromSubdirs = Object.values(subdirFiles).flat();
    return [...topLevel, ...fromSubdirs];
  }, [concatenatedResults, subdirFiles]);

  const parsedNames = useMemo(() => {
    if (!allFiles) return null;
    return parseFileNames(allFiles).map((s) => s.sampName);
  }, [allFiles]);

  const isSubdirLoading = Object.values(subdirLoading).some(Boolean);
  const allSubdirsReported = subdirs.every((dir) => dir.path! in subdirFiles);
  const scanning =
    isLoading ||
    isSubdirLoading ||
    (!!scanTarget && !isLoading && subdirs.length > 0 && !allSubdirsReported);

  useEffect(() => {
    if (scanTarget && !scanning && parsedNames !== null) {
      onConfirm(parsedNames);
      onClose();
    }
  }, [scanTarget, scanning, parsedNames, onConfirm, onClose]);

  const handleNavigate = useCallback(
    (systemId: string | null, path: string) => {
      setSelectedSystem(systemId);
      setSelectedPath(path);
      setScanTarget(null);
    },
    []
  );

  const handleImport = useCallback(() => {
    if (selectedSystem) {
      setScanTarget({ system: selectedSystem, path: selectedPath });
    }
  }, [selectedSystem, selectedPath]);

  return (
    <>
      {scanTarget &&
        subdirs.map((dir) => (
          <SubdirFiles
            key={dir.path}
            systemId={scanTarget.system}
            path={dir.path!}
            onResult={handleSubdirResult}
          />
        ))}
      <FileModal
        open={open}
        onClose={onClose}
        title="Select directory containing sequencing files"
        onNavigate={handleNavigate}
        renderFooter={() => (
          <Button
            color="primary"
            disabled={!selectedSystem || scanning}
            onClick={handleImport}
          >
            {scanning ? 'Parsing…' : 'Import Sample Names'}
          </Button>
        )}
      />
    </>
  );
};

export default FilenameImportModal;
