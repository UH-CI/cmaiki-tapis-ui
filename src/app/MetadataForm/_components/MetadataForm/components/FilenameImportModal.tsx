import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from 'reactstrap';
import { Files as Hooks } from '@tapis/tapisui-hooks';
import { Files } from '@tapis/tapis-typescript';
import FileModal from './FileModal';
import { parseFileNames } from '../hooks/useFileNameParser';

export interface ImportedSample {
  sampName: string;
  sequencingRun?: string;
}

interface FilenameImportModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (samples: ImportedSample[]) => void;
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
    if (!open) {
      setScanTarget(null);
    }
  }, [open]);

  useEffect(() => {
    setSubdirFiles({});
    setSubdirLoading({});
  }, [scanTarget]);

  const parsedSamples = useMemo((): ImportedSample[] | null => {
    if (!concatenatedResults) return null;

    const topLevelFiles = concatenatedResults.filter((f) => f.type === 'file');

    if (subdirs.length === 0) {
      return parseFileNames(topLevelFiles).map((s) => ({
        sampName: s.sampName,
      }));
    }

    const results: ImportedSample[] = [];
    Object.entries(subdirFiles).forEach(([subdirPath, files]) => {
      const subdirName =
        subdirPath.split('/').filter(Boolean).pop() ?? subdirPath;
      parseFileNames(files).forEach((s) =>
        results.push({ sampName: s.sampName, sequencingRun: subdirName })
      );
    });
    parseFileNames(topLevelFiles).forEach((s) =>
      results.push({ sampName: s.sampName })
    );

    return results;
  }, [concatenatedResults, subdirFiles, subdirs.length]);

  const isSubdirLoading = Object.values(subdirLoading).some(Boolean);
  const allSubdirsReported = subdirs.every((dir) => dir.path! in subdirFiles);
  const scanning =
    !!scanTarget &&
    (isLoading ||
      isSubdirLoading ||
      (subdirs.length > 0 && !allSubdirsReported));

  useEffect(() => {
    if (scanTarget && !scanning && parsedSamples !== null) {
      onConfirm(parsedSamples);
      onClose();
    }
  }, [scanTarget, scanning, parsedSamples, onConfirm, onClose]);

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
        title="Select directory containing sequencing files or subdirectories"
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
