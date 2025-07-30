import React, { useCallback, useMemo } from 'react';
import { Files as Hooks } from '@tapis/tapisui-hooks';
import { Files } from '@tapis/tapis-typescript';
import { QueryWrapper } from '../../../wrappers';
import {
  MuiBreadcrumbs,
  useFileNavigation,
  OnNavigateCallback,
} from '../../../ui';
import sizeFormat from '../../../utils/sizeFormat';
import { formatDateTimeFromValue } from '../../../utils/timeFormat';
import {
  Box,
  Button,
  Tooltip,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
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
} from '@mui/icons-material';
import styles from './FileListing.module.scss';

export type OnSelectCallback = (files: Array<Files.FileInfo>) => any;

const ErrorDisplay: React.FC<{
  error: any;
}> = ({ error }) => {
  const getErrorMessage = (error: any) => {
    // Handle 403 Forbidden errors
    if (error?.response?.status === 403 || error?.status === 403) {
      return {
        title: 'Access Denied',
        message: 'You do not have permission to access this directory.',
        severity: 'warning' as const,
      };
    }

    // Handle network/connection errors
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the file system.',
        severity: 'error' as const,
      };
    }

    // Generic error fallback
    return {
      title: 'Error Loading Directory',
      message:
        error?.message ||
        'An unexpected error occurred while loading the directory.',
      severity: 'error' as const,
    };
  };

  const { title, message, severity } = getErrorMessage(error);

  return (
    <Box sx={{ p: 3 }}>
      <Alert severity={severity}>
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};

const FileListingDir: React.FC<{
  file: Files.FileInfo;
  onNavigate?: (file: Files.FileInfo) => void;
}> = ({ file, onNavigate }) => (
  <Button
    variant="text"
    size="small"
    disableRipple
    sx={{
      color: '#1976d2',
      fontWeight: 500,
      fontSize: '1rem',
      textTransform: 'none',
      justifyContent: 'flex-start',
      width: '100%',
      '&:hover': {
        textDecoration: 'underline',
        backgroundColor: 'transparent',
      },
    }}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onNavigate) {
        onNavigate(file);
      }
    }}
    disabled={!onNavigate}
  >
    {file.name}/
  </Button>
);

export type SelectMode = {
  mode: 'none' | 'single' | 'multi';
  types?: Array<'dir' | 'file'>;
};

const resolveIcon = (type: Files.FileInfo['type']) => {
  const iconMap: Record<Files.FileTypeEnum, React.ReactElement> = {
    [Files.FileTypeEnum.File]: <InsertDriveFileOutlined />,
    [Files.FileTypeEnum.Dir]: <FolderOutlined />,
    [Files.FileTypeEnum.SymbolicLink]: <LinkIcon />,
    [Files.FileTypeEnum.Other]: <QuestionMark />,
    [Files.FileTypeEnum.Unknown]: <QuestionMark />,
  };

  const icon = type ? iconMap[type] : <QuestionMark />;
  return <Tooltip title={type || 'Unknown'}>{icon}</Tooltip>;
};

export const FileListingName: React.FC<{
  file: Files.FileInfo;
  onNavigate?: (file: Files.FileInfo) => void;
}> = ({ file, onNavigate }) =>
  file.type === 'file' ? (
    <Typography sx={{ fontSize: '1rem' }}>{file.name}</Typography>
  ) : (
    <FileListingDir file={file} onNavigate={onNavigate} />
  );

export const FileListingTable: React.FC<{
  files: Array<Files.FileInfo>;
  appendColumns?: Array<GridColDef>;
  isLoading?: boolean;
  onNavigate?: (file: Files.FileInfo) => void;
  className?: string;
  selectMode?: SelectMode;
  fields?: Array<'size' | 'lastModified'>;
  selectedFiles?: Array<Files.FileInfo>;
  onSelect?: OnSelectCallback;
  onUnselect?: OnSelectCallback;
}> = ({
  files,
  appendColumns = [],
  isLoading = false,
  onNavigate,
  className,
  selectMode,
  fields = ['size', 'lastModified'],
  selectedFiles = [],
  onSelect,
  onUnselect,
}) => {
  // Use file paths as selection model directly
  const selectionModel = useMemo(
    () => selectedFiles.map((file) => file.path || ''),
    [selectedFiles]
  );

  const handleSelectionChange = useCallback(
    (newSelection: GridRowSelectionModel) => {
      const oldSet = new Set(selectionModel);
      const newSet = new Set(newSelection);

      const selected = files.filter((file) => {
        const path = file.path || '';
        return newSet.has(path) && !oldSet.has(path);
      });

      const deselected = files.filter((file) => {
        const path = file.path || '';
        return oldSet.has(path) && !newSet.has(path);
      });

      if (selected.length && onSelect) onSelect(selected);
      if (deselected.length && onUnselect) onUnselect(deselected);
    },
    [files, selectionModel, onSelect, onUnselect]
  );

  // Navigate on row click for directories
  const handleRowClick = useCallback(
    (params: GridRowParams) => {
      const file = params.row as Files.FileInfo;
      if (file.type === Files.FileTypeEnum.Dir && onNavigate) {
        onNavigate(file);
      }
    },
    [onNavigate]
  );

  // Build columns array
  const columns: GridColDef[] = useMemo(() => {
    const baseColumns: GridColDef[] = [
      {
        field: 'type',
        headerName: 'Type',
        width: 60,
        renderCell: (params) => resolveIcon(params.value),
      },
      {
        field: 'name',
        headerName: 'Filename',
        flex: 1,
        minWidth: 250,
        align: 'left',
        renderCell: (params) => (
          <FileListingName file={params.row} onNavigate={onNavigate} />
        ),
      },
    ];

    if (fields.includes('size')) {
      baseColumns.push({
        field: 'size',
        headerName: 'Size',
        width: 120,
        renderCell: (params) => (
          <Typography>{sizeFormat(params.value)}</Typography>
        ),
      });
    }

    if (fields.includes('lastModified')) {
      baseColumns.push({
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

    return [...baseColumns, ...appendColumns];
  }, [fields, appendColumns, onNavigate]);

  // Prepare rows with file path as ID
  const rows = useMemo(
    () => files.map((file) => ({ ...file, id: file.path })),
    [files]
  );

  return (
    <Box className={`${className} ${styles.dataGridContainer}`}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        checkboxSelection={selectMode?.mode !== 'none'}
        disableRowSelectionOnClick={selectMode?.mode === 'none'}
        onRowClick={handleRowClick}
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={handleSelectionChange}
        getRowClassName={(params) =>
          `MuiDataGrid-row--${
            params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
          }`
        }
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 50 } },
        }}
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
  onPathChange?: (newPath: string) => void;
  location?: string;
  className?: string;
  fields?: Array<'size' | 'lastModified'>;
  selectedFiles?: Array<Files.FileInfo>;
  selectMode?: SelectMode;
}

const FileListing: React.FC<FileListingProps> = ({
  systemId,
  path: rawPath,
  onSelect,
  onUnselect,
  onNavigate,
  onPathChange,
  className,
  fields = ['size', 'lastModified'],
  selectedFiles = [],
  selectMode,
}) => {
  // Create a wrapper for onNavigate to handle both the original callback and path changes
  const handleNavigate = useCallback(
    (file: Files.FileInfo) => {
      if (onNavigate) {
        onNavigate(file);
      }
      if (onPathChange && file.path) {
        onPathChange(file.path);
      }
    },
    [onNavigate, onPathChange]
  );

  const navigation = useFileNavigation(rawPath, handleNavigate);
  const { isLoading, error, concatenatedResults, isFetchingNextPage } =
    Hooks.useList({ systemId, path: navigation.currentPath });

  const files = useMemo(() => concatenatedResults ?? [], [concatenatedResults]);

  return (
    <Box className={className}>
      <MuiBreadcrumbs
        currentPath={navigation.currentPath}
        onBack={navigation.goBack}
        canGoBack={navigation.canGoBack}
        onNavigateToPath={navigation.navigateToPath}
        className={styles['file-listing-header']}
      />

      <QueryWrapper isLoading={isLoading} error={error}>
        {error ? (
          <ErrorDisplay error={error} />
        ) : (
          <FileListingTable
            files={files}
            isLoading={isFetchingNextPage}
            onNavigate={navigation.navigateToDirectory}
            fields={fields}
            selectMode={selectMode}
            selectedFiles={selectedFiles}
            onSelect={onSelect}
            onUnselect={onUnselect}
          />
        )}
      </QueryWrapper>
    </Box>
  );
};

export default FileListing;
