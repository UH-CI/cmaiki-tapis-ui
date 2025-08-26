import React, { useState, useCallback, useMemo } from 'react';
import { Systems } from '@tapis/tapis-typescript';
import { Systems as Hooks, useTapisConfig } from '@tapis/tapisui-hooks';
import { QueryWrapper } from '../../../wrappers';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridRowParams,
} from '@mui/x-data-grid';
import { Storage as StorageIcon } from '@mui/icons-material';
import styles from './SystemListing.module.scss';

type SystemListItemProps = {
  system: Systems.TapisSystem;
  onNavigate?: (system: Systems.TapisSystem) => void;
};

const SystemListingItem: React.FC<SystemListItemProps> = ({
  system,
  onNavigate,
}) => {
  if (onNavigate) {
    return (
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
          onNavigate(system);
        }}
        data-testid={`href-${system.id}`}
      >
        {system.id}
      </Button>
    );
  }
  return <Typography sx={{ fontSize: '1rem' }}>{system.id}</Typography>;
};

export const SystemListingTable: React.FC<{
  systems: Array<Systems.TapisSystem>;
  isLoading?: boolean;
  onNavigate?: (system: Systems.TapisSystem) => void;
  className?: string;
  selectedSystem?: Systems.TapisSystem | null;
  onSelect?: (system: Systems.TapisSystem) => void;
}> = ({
  systems,
  isLoading = false,
  onNavigate,
  className,
  selectedSystem,
  onSelect,
}) => {
  // Use system id as selection model
  const selectionModel = useMemo(
    () => (selectedSystem?.id ? [selectedSystem.id] : []),
    [selectedSystem]
  );

  const handleSelectionChange = useCallback(
    (newSelection: GridRowSelectionModel) => {
      if (newSelection.length > 0 && onSelect) {
        const systemId = newSelection[0] as string;
        const system = systems.find((s) => s.id === systemId);
        if (system) {
          onSelect(system);
        }
      }
    },
    [systems, onSelect]
  );

  // Navigate on row click
  const handleRowClick = useCallback(
    (params: GridRowParams) => {
      const system = params.row as Systems.TapisSystem;
      if (onNavigate) {
        onNavigate(system);
      }
    },
    [onNavigate]
  );

  // Build columns array
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'icon',
        headerName: '',
        width: 60,
        sortable: false,
        renderCell: () => <StorageIcon />,
      },
      {
        field: 'id',
        headerName: 'System',
        flex: 1,
        minWidth: 250,
        align: 'left',
        renderCell: (params) => (
          <SystemListingItem system={params.row} onNavigate={onNavigate} />
        ),
      },
    ],
    [onNavigate]
  );

  // Prepare rows with system id as ID
  const rows = useMemo(
    () => systems.map((system) => ({ ...system, icon: 'storage' })),
    [systems]
  );

  return (
    <Box className={`${className} ${styles.dataGridContainer}`}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        checkboxSelection={false}
        disableRowSelectionOnClick={false}
        onRowClick={handleRowClick}
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={handleSelectionChange}
        hideFooter
        getRowClassName={(params) =>
          `MuiDataGrid-row--${
            params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
          } ${selectedSystem?.id === params.row.id ? styles.selected : ''}`
        }
        slots={{
          noRowsOverlay: () => (
            <Box className={styles.noRowsOverlay}>
              <Typography>No systems found</Typography>
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

type SystemListingProps = {
  onSelect?: (system: Systems.TapisSystem) => void;
  onNavigate?: (system: Systems.TapisSystem) => void;
  className?: string;
};

const SystemListing: React.FC<SystemListingProps> = ({
  onSelect,
  onNavigate,
  className,
}) => {
  const { data, isLoading, error } = Hooks.useList({
    select: 'allAttributes',
    listType: Systems.ListTypeEnum.All,
  });
  const { claims } = useTapisConfig();

  const tapisUserName = claims['tapis/username'];

  const [selectedSystem, setSelectedSystem] =
    useState<Systems.TapisSystem | null>(null);

  const selectWrapper = useCallback(
    (system: Systems.TapisSystem) => {
      setSelectedSystem(system);
      if (onSelect) {
        onSelect(system);
      }
    },
    [setSelectedSystem, onSelect]
  );

  const systems: Array<Systems.TapisSystem> = data?.result ?? [];

  // Filter to only display systems where tapisUserName is in sharedWithUsers
  const filteredSystems = systems.filter((system) => {
    return system?.sharedWithUsers?.includes(tapisUserName);
  });

  return (
    <Box className={`${styles.systemListingContainer} ${className}`}>
      <QueryWrapper
        isLoading={isLoading}
        error={error}
        className={styles.queryWrapperContainer}
      >
        <div className={styles.dataGridContainer}>
          <SystemListingTable
            systems={filteredSystems}
            isLoading={isLoading}
            onNavigate={onNavigate}
            selectedSystem={selectedSystem}
            onSelect={selectWrapper}
          />
        </div>
      </QueryWrapper>
    </Box>
  );
};

export default SystemListing;
