import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import { Files as Hooks } from '@tapis/tapisui-hooks';
import { Files } from '@tapis/tapis-typescript';
import { InfiniteScrollTable } from '../../../ui';
import { QueryWrapper } from '../../../wrappers';
import { Row, Column, CellProps } from 'react-table';
import sizeFormat from '../../../utils/sizeFormat';
import { Button } from 'reactstrap';
import { formatDateTimeFromValue } from '../../../utils/timeFormat';
import {
  CheckBoxOutlineBlank,
  CheckBox,
  InsertDriveFileOutlined,
  FolderOutlined,
  Link,
  QuestionMark,
  ArrowBack,
} from '@mui/icons-material';
import styles from './FileListing.module.scss';
import { Tooltip } from '@mui/material';
import normalize from 'normalize-path';

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
    <div className={styles['file-listing-header']}>
      <div className={styles['file-listing-actions']}>
        <span className={styles['current-path']}>{normalizedPath}</span>
      </div>
      <div className={styles['file-listing-navigation']}>
        <Button
          color="link"
          className={styles['back-button']}
          onClick={onBack}
          disabled={!canGoBack}
          data-testid="btn-back"
        >
          <ArrowBack /> Back
        </Button>
      </div>
    </div>
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
  if (location) {
    const normalizedPath = normalize(`${location}/${file.name ?? ''}`);
    return (
      <NavLink to={normalizedPath} className={styles.dir}>
        {file.name}/
      </NavLink>
    );
  }
  if (onNavigate) {
    return (
      <Button
        color="link"
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
  return <span>{file.name}/</span>;
};

type FileListingCheckboxCell = {
  selected: boolean;
};

/* eslint-disable-next-line */
export const FileListingCheckboxCell: React.FC<FileListingCheckboxCell> =
  React.memo(({ selected }) => {
    return <span>{selected ? <CheckBox /> : <CheckBoxOutlineBlank />}</span>;
  });

interface FileListingItemProps {
  file: Files.FileInfo;
  onNavigate?: OnNavigateCallback;
  location?: string;
}

const FileListingName: React.FC<FileListingItemProps> = ({
  file,
  onNavigate = undefined,
  location = undefined,
}) => {
  if (file.type === 'file') {
    return <>{file.name}</>;
  }
  return (
    <FileListingDir file={file} onNavigate={onNavigate} location={location} />
  );
};

export type SelectMode = {
  mode: 'none' | 'single' | 'multi';
  // If undefined, allowed selectable file types will be treated as [ "file", "dir" ]
  types?: Array<'dir' | 'file'>;
};

type FileListingTableProps = {
  files: Array<Files.FileInfo>;
  prependColumns?: Array<Column>;
  appendColumns?: Array<Column>;
  getRowProps?: (row: Row) => any;
  onInfiniteScroll?: () => any;
  isLoading?: boolean;
  onNavigate?: OnNavigateCallback;
  location?: string;
  className?: string;
  selectMode?: SelectMode;
  fields?: Array<'size' | 'lastModified'>;
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
      icon = <Link />;
      break;
    case Files.FileTypeEnum.Other:
    case Files.FileTypeEnum.Unknown:
    default:
      icon = <QuestionMark />;
      break;
  }

  return <Tooltip title={type}>{icon}</Tooltip>;
};

export const FileListingTable: React.FC<FileListingTableProps> = React.memo(
  ({
    files,
    prependColumns = [],
    appendColumns = [],
    getRowProps,
    onInfiniteScroll,
    isLoading,
    onNavigate,
    location,
    className,
    selectMode,
    fields,
  }) => {
    const styleName =
      selectMode?.mode !== 'none' ? 'file-list-select' : 'file-list';

    const tableColumns: Array<Column> = [
      ...prependColumns,
      {
        Header: '',
        accessor: 'type',
        Cell: (el) => resolveIcon(el.value),
      },
      {
        Header: 'filename',
        Cell: (el) => (
          <FileListingName
            file={el.row.original}
            onNavigate={onNavigate}
            location={location}
          />
        ),
      },
    ];

    if (fields?.some((field) => field === 'size')) {
      tableColumns.push({
        Header: 'size',
        accessor: 'size',
        Cell: (el) => <span>{sizeFormat(el.value)}</span>,
      });
    }

    if (fields?.some((field) => field === 'lastModified')) {
      tableColumns.push({
        Header: 'last modified',
        accessor: 'lastModified',
        Cell: (el) => (
          <span>{formatDateTimeFromValue(new Date(el.value))}</span>
        ),
      });
    }

    tableColumns.push(...appendColumns);

    return (
      <InfiniteScrollTable
        className={`${className} ${styles[styleName]}`}
        tableColumns={tableColumns}
        tableData={files}
        onInfiniteScroll={onInfiniteScroll}
        isLoading={isLoading}
        noDataText="No files found"
        getRowProps={getRowProps}
      />
    );
  }
);

type FileSelectHeaderProps = {
  onSelectAll: () => void;
  onUnselectAll: () => void;
  selectedFileDict: SelectFileDictType;
};

type SelectFileDictType = { [path: string]: boolean };

const FileSelectHeader: React.FC<FileSelectHeaderProps> = ({
  onSelectAll,
  onUnselectAll,
  selectedFileDict,
}) => {
  const [checked, setChecked] = useState(false);
  const allSelected = Object.values(selectedFileDict).some(
    (value) => value === false
  );
  const onClick = useCallback(() => {
    if (checked && !allSelected) {
      setChecked(false);
      onUnselectAll();
    } else {
      setChecked(true);
      onSelectAll();
    }
  }, [checked, setChecked, onSelectAll, onUnselectAll, allSelected]);

  return (
    <span
      className={styles['select-all']}
      onClick={onClick}
      data-testid="select-all"
    >
      <FileListingCheckboxCell selected={checked && !allSelected} />
    </span>
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

  const {
    hasNextPage,
    isLoading,
    error,
    fetchNextPage,
    concatenatedResults,
    isFetchingNextPage,
  } = Hooks.useList({ systemId, path });

  const infiniteScrollCallback = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  const files: Array<Files.FileInfo> = useMemo(
    () => concatenatedResults ?? [],
    [concatenatedResults]
  );

  const selectedFileDict: SelectFileDictType = React.useMemo(() => {
    const result: SelectFileDictType = {};
    const selectedDict: SelectFileDictType = {};
    selectedFiles.forEach((file) => {
      selectedDict[file.path ?? ''] = true;
    });
    concatenatedResults?.forEach((file) => {
      result[file.path ?? ''] = selectedDict[file.path ?? ''] ?? false;
    });
    return result;
  }, [selectedFiles, concatenatedResults]);

  const prependColumns = selectMode?.types?.length
    ? [
        {
          Header: (
            <FileSelectHeader
              onSelectAll={() =>
                onSelect && onSelect(concatenatedResults ?? [])
              }
              onUnselectAll={() =>
                onUnselect && onUnselect(concatenatedResults ?? [])
              }
              selectedFileDict={selectedFileDict}
            />
          ),
          id: 'multiselect',
          Cell: (el: React.PropsWithChildren<CellProps<{}, any>>) => (
            <FileListingCheckboxCell
              selected={
                selectedFileDict[(el.row.original as Files.FileInfo).path ?? '']
              }
            />
          ),
        },
      ]
    : [];

  const fileSelectCallback = useCallback(
    (file: Files.FileInfo) => {
      if (!selectMode?.types?.some((allowed) => allowed === file.type)) {
        return;
      }
      if (selectedFileDict[file.path ?? ''] && onUnselect) {
        onUnselect([file]);
      } else {
        onSelect && onSelect([file]);
      }
    },
    [selectMode, onUnselect, selectedFileDict, onSelect]
  );

  // Maps rows to row properties, such as classNames
  const getRowProps = (row: Row) => {
    const file: Files.FileInfo = row.original as Files.FileInfo;
    return {
      onClick: () => fileSelectCallback(file),
      'data-testid': file.name,
      className: selectedFileDict[file.path ?? ''] ? styles.selected : '',
    };
  };

  return (
    <div className={className}>
      <FileListingHeader
        onBack={handleBack}
        canGoBack={navigationHistory.length > 1}
        currentPath={path}
      />
      <QueryWrapper isLoading={isLoading} error={error}>
        <FileListingTable
          files={files}
          prependColumns={prependColumns}
          onInfiniteScroll={infiniteScrollCallback}
          isLoading={isFetchingNextPage}
          getRowProps={getRowProps}
          location={location}
          onNavigate={onNavigate}
          fields={fields}
          selectMode={selectMode}
        />
      </QueryWrapper>
    </div>
  );
};

export default FileListing;
