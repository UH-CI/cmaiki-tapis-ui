import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import { Files as Hooks } from '@tapis/tapisui-hooks';
import { Files } from '@tapis/tapis-typescript';
import { QueryWrapper } from '../../../wrappers';
import sizeFormat from '../../../utils/sizeFormat';
import { formatDateTimeFromValue } from '../../../utils/timeFormat';
import normalize from 'normalize-path';
import {
  Box,
  Button,
  Tooltip,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridRowParams,
} from '@mui/x-data-grid';
import {
  InsertDriveFileOutlined,
  FolderOutlined,
  Link as LinkIcon,
  QuestionMark,
  ArrowBack,
} from '@mui/icons-material';
import styles from './FileListing.module.scss';

export type OnSelectCallback = (files: Array<Files.FileInfo>) => any;
export type OnNavigateCallback = (file: Files.FileInfo) => any;

interface FileListingHeaderProps {
  onBack: () => void;
  canGoBack: boolean;
  currentPath: string;
}

const FileListingHeader: React.FC<FileListingHeaderProps> = ({
  onBack,
  canGoBack,
  currentPath,
}) => {
  const normalizedPath = normalize(currentPath);

  return (
    <Box className={styles['file-listing-header']}>
      <Box className={styles['file-listing-actions']}>
        <Typography variant="body1" className={styles['current-path']}>
          {normalizedPath}
        </Typography>
      </Box>
      <Box className={styles['file-listing-navigation']}>
        <Button
          variant="text"
          className={styles['back-button']}
          onClick={onBack}
          disabled={!canGoBack}
          data-testid="btn-back"
          startIcon={<ArrowBack />}
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};

interface FileListingDirProps {
  file: Files.FileInfo;
  onNavigate?: OnNavigateCallback;
  location?: string;
}

const FileListingDir: React.FC<FileListingDirProps> = ({
  file,
  onNavigate = undefined,
  location = undefined,
}) => {
  // When viewing from Files section, no wrapper
  if (location) {
    const normalizedPath = normalize(`${location}/${file.name ?? ''}`);
    return (
      <Box display="flex" alignItems="center" height="100%">
        <NavLink to={normalizedPath} className={styles.dir}>
          {file.name}/
        </NavLink>
      </Box>
    );
  }
  // When used within File Explorer (i.e. Input file explorer)
  if (onNavigate) {
    return (
      <Button
        variant="text"
        size="small"
        disableRipple
        className={styles.link}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onNavigate(file);
        }}
        data-testid={`btn-link-${file.name}`}
      >
        {file.name}/
      </Button>
    );
  }
  return (
    <Typography
      variant="body2"
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {file.name}/
    </Typography>
  );
};

export type SelectMode = {
  mode: 'none' | 'single' | 'multi';
  // If undefined, allowed selectable file types will be treated as [ "file", "dir" ]
  types?: Array<'dir' | 'file'>;
};

const resolveIcon = (type: Files.FileInfo['type']) => {
  let icon: React.ReactElement = <></>;
  switch (type) {
    case Files.FileTypeEnum.File:
      icon = <InsertDriveFileOutlined />;
      break;
    case Files.FileTypeEnum.Dir:
      icon = <FolderOutlined />;
      break;
    case Files.FileTypeEnum.SymbolicLink:
      icon = <LinkIcon />;
      break;
    case Files.FileTypeEnum.Other:
    case Files.FileTypeEnum.Unknown:
    default:
      icon = <QuestionMark />;
      break;
  }

  return <Tooltip title={type}>{icon}</Tooltip>;
};

export const FileListingName: React.FC<{
  file: Files.FileInfo;
  onNavigate?: OnNavigateCallback;
  location?: string;
}> = ({ file, onNavigate, location }) => {
  if (file.type === 'file') {
    return (
      <Typography
      // variant="body2"
      // style={{ display: 'flex', alignItems: 'center' }}
      >
        {file.name}
      </Typography>
    );
  }
  return (
    <FileListingDir file={file} onNavigate={onNavigate} location={location} />
  );
};

interface FileListingTableProps {
  files: Array<Files.FileInfo>;
  isLoading?: boolean;
  onNavigate?: OnNavigateCallback;
  location?: string;
  className?: string;
  selectMode?: SelectMode;
  fields?: Array<'size' | 'lastModified'>;
  // Pass file selection to FileListingTable props for mui
  selectedFiles?: Array<Files.FileInfo>;
  onSelect?: OnSelectCallback;
  onUnselect?: OnSelectCallback;
}

export const FileListingTable: React.FC<FileListingTableProps> = ({
  files,
  isLoading = false,
  onNavigate,
  location,
  className,
  selectMode,
  fields = ['size', 'lastModified'],
  selectedFiles = [],
  onSelect,
  onUnselect,
}) => {
  // Mui's grid row selection management
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(
    []
  );

  // Prepare selected files for the DataGrid
  useEffect(() => {
    const selectedPaths = selectedFiles.map((file) => file.path || '');
    setSelectionModel(selectedPaths);
  }, [selectedFiles]);

  // Handle selection changes in Mui row selection state
  // Selection management, track what is being selected, unselected, already selected
  const handleSelectionModelChange = (
    newSelectionModel: GridRowSelectionModel
  ) => {
    const oldSelectionSet = new Set(selectionModel);
    const newSelectionSet = new Set(newSelectionModel);

    // Find newly selected files
    const newlySelected = files.filter((file) => {
      const path = file.path || '';
      return newSelectionSet.has(path) && !oldSelectionSet.has(path);
    });

    // Find newly deselected files
    const newlyDeselected = files.filter((file) => {
      const path = file.path || '';
      return oldSelectionSet.has(path) && !newSelectionSet.has(path);
    });

    if (newlySelected.length > 0 && onSelect) {
      onSelect(newlySelected);
    }

    if (newlyDeselected.length > 0 && onUnselect) {
      onUnselect(newlyDeselected);
    }

    setSelectionModel(newSelectionModel);
  };

  // Handle row click for navigation
  // When used within File Explorer (i.e. Input file explorer)
  const handleRowClick = (params: GridRowParams) => {
    const file = params.row as Files.FileInfo;
    if (file.type === Files.FileTypeEnum.Dir && onNavigate) {
      onNavigate(file);
    }
  };

  // Create columns for the DataGrid
  const columns: GridColDef[] = [
    {
      field: 'type',
      headerName: 'Type',
      width: 60,
      // Listing type icon
      renderCell: (params) => resolveIcon(params.value),
    },
    {
      field: 'name',
      headerName: 'Filename',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <FileListingName
          file={params.row}
          onNavigate={onNavigate}
          location={location}
        />
      ),
    },
  ];
  if (fields.includes('size')) {
    columns.push({
      field: 'size',
      headerName: 'Size',
      width: 120,
      renderCell: (params) => (
        <Typography>{sizeFormat(params.value)}</Typography>
      ),
    });
  }
  if (fields.includes('lastModified')) {
    columns.push({
      field: 'lastModified',
      headerName: 'Last Modified',
      width: 180,
      renderCell: (params) => (
        <Typography>
          {formatDateTimeFromValue(new Date(params.value))}
        </Typography>
      ),
    });
  }

  // Prepare rows for the DataGrid
  const rows = files.map((file) => ({
    ...file,
    id: file.path,
  }));

  return (
    <Box className={`${className} ${styles.dataGridContainer}`}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        pagination
        checkboxSelection={selectMode?.mode !== 'none'}
        disableRowSelectionOnClick={selectMode?.mode === 'none'}
        onRowClick={handleRowClick}
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={handleSelectionModelChange}
        getRowClassName={(params) =>
          `MuiDataGrid-row--${
            params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
          }`
        }
        paginationMode="client"
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 50 } },
        }}
        // Mui datagrid customization, add overlays for loading and no rows
        // Used to be handled by InfiniteScrollTable
        slots={{
          noRowsOverlay: () => (
            <Box className={styles.noRowsOverlay}>
              <Typography>No files found</Typography>
            </Box>
          ),
          loadingOverlay: () => (
            <Box className={styles.loadingOverlay}>
              <CircularProgress />
            </Box>
          ),
        }}
      />
    </Box>
  );
};

interface FileListingProps {
  systemId: string;
  path: string;
  onSelect?: OnSelectCallback;
  onUnselect?: OnSelectCallback;
  onNavigate?: OnNavigateCallback;
  location?: string;
  className?: string;
  fields?: Array<'size' | 'lastModified'>;
  selectedFiles?: Array<Files.FileInfo>;
  selectMode?: SelectMode;
}

const FileListing: React.FC<FileListingProps> = ({
  systemId,
  path: rawPath,
  onSelect = undefined,
  onUnselect = undefined,
  onNavigate = undefined,
  location: rawLocation = undefined,
  className,
  fields = ['size', 'lastModified'],
  selectedFiles = [],
  selectMode,
}) => {
  // Consolidated navigation to FileListing, used to be in FileListing and FileExplorer
  const history = useHistory();
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  const path = useMemo(() => normalize(rawPath), [rawPath]);
  const location = useMemo(
    () => (rawLocation ? normalize(rawLocation) : undefined),
    [rawLocation]
  );

  useEffect(() => {
    setNavigationHistory((prev) => {
      const normalizedPath = normalize(rawPath);
      if (prev[prev.length - 1] !== normalizedPath) {
        return [...prev, normalizedPath];
      }
      return prev;
    });
  }, [rawPath]);

  const getParentPath = useCallback((currentPath: string) => {
    const segments = currentPath.split('/').filter(Boolean);
    segments.pop();
    return segments.length ? normalize('/' + segments.join('/')) : '/';
  }, []);

  const handleBack = useCallback(() => {
    if (navigationHistory.length > 1) {
      setNavigationHistory((prev) => prev.slice(0, -1));

      if (location) {
        const parentPath = getParentPath(location);
        history.push(parentPath);
      } else if (onNavigate) {
        const parentPath = getParentPath(path);
        const pathSegments = path.split('/').filter(Boolean);

        const previousDir: Files.FileInfo = {
          name: pathSegments[pathSegments.length - 2] || '', // Get parent directory name
          path: parentPath,
          type: Files.FileTypeEnum.Dir,
        };
        onNavigate(previousDir);
      }
    }
  }, [navigationHistory, location, history, onNavigate, path, getParentPath]);

  const { isLoading, error, concatenatedResults, isFetchingNextPage } =
    Hooks.useList({ systemId, path });

  const files: Array<Files.FileInfo> = useMemo(
    () => concatenatedResults ?? [],
    [concatenatedResults]
  );

  return (
    <Box className={className}>
      <FileListingHeader
        onBack={handleBack}
        canGoBack={navigationHistory.length > 1}
        currentPath={path}
      />
      <QueryWrapper isLoading={isLoading} error={error}>
        <FileListingTable
          files={files}
          isLoading={isFetchingNextPage}
          location={location}
          onNavigate={onNavigate}
          fields={fields}
          selectMode={selectMode}
          selectedFiles={selectedFiles}
          onSelect={onSelect}
          onUnselect={onUnselect}
        />
      </QueryWrapper>
    </Box>
  );
};

export default FileListing;
