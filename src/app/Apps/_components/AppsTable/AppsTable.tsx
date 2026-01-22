import React from 'react';
import { useRouteMatch, NavLink } from 'react-router-dom';
import { useList } from '@tapis/tapisui-hooks/dist/apps';
import { Apps as Hooks } from '@tapis/tapisui-hooks';
import { Apps } from '@tapis/tapis-typescript';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Typography, CircularProgress, Tooltip } from '@mui/material';
import styles from './AppsTable.module.scss';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface AppListingTableProps {
  apps: Array<Apps.TapisApp>;
  isLoading?: boolean;
}

export const AppListingTable: React.FC<AppListingTableProps> = ({
  apps,
  isLoading = false,
}) => {
  const { url } = useRouteMatch();

  const excludeList: string[] = [''];

  const filteredApps = apps.filter((app) => {
    if (!app || !app.id) {
      return false;
    }
    return !excludeList.includes(app.id);
  });

  const appOrder = [
    'demux-app-uhhpc',
    'ITS-pipeline-uhhpc',
    '16S-v0.0.2-pipeline-uhhpc',
    '16Sv1-pipeline-uhhpc',
    'ampliseq-ITS-pipeline-uhhpc',
    'ampliseq-16S-pipeline-uhhpc',
    'ampliseq-condensed-pipeline-test',
    'ampliseq-pipeline-test',
  ];

  const sortedApps = filteredApps.sort((a, b) => {
    const indexA = appOrder.indexOf(a.id ?? '');
    const indexB = appOrder.indexOf(b.id ?? '');
    const orderA = indexA === -1 ? appOrder.length : indexA;
    const orderB = indexB === -1 ? appOrder.length : indexB;
    return orderA - orderB;
  });

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Name',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'description',
      headerName: 'Short Description',
      flex: 2,
      minWidth: 400,
    },
    {
      field: 'version',
      headerName: 'App Version',
      flex: 0.5,
      minWidth: 120,
      sortable: false,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      minWidth: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const helpSite = params.row.notes?.['help-site'];

        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Run App" arrow placement="top">
              <NavLink
                to={`${url}/${params.row.id}/${params.row.version}`}
                style={{ textDecoration: 'none' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    padding: '4px 12px',
                    borderRadius: '4px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontSize: '0.875rem',
                    '&:hover': {
                      backgroundColor: '#1565c0',
                    },
                  }}
                >
                  <PlayArrowIcon sx={{ fontSize: 16 }} />
                  <span>Run</span>
                </Box>
              </NavLink>
            </Tooltip>
            {helpSite && (
              <Tooltip title="Help Documentation" arrow placement="top">
                <a
                  href={helpSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      backgroundColor: 'white',
                      color: '#666',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        borderColor: '#999',
                      },
                    }}
                  >
                    <HelpOutlineIcon sx={{ fontSize: 18 }} />
                  </Box>
                </a>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  const rows = sortedApps.map((app) => ({
    ...app,
    id: app.id,
  }));

  return (
    <Box className={styles.tableContainer}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        disableColumnMenu
        disableColumnFilter
        disableColumnSelector
        disableDensitySelector
        disableRowSelectionOnClick
        disableVirtualization
        hideFooter
        autoHeight
        getRowClassName={(params) =>
          `MuiDataGrid-row--${
            params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
          }`
        }
        slots={{
          noRowsOverlay: () => (
            <Box className={styles.noRowsOverlay}>
              <Typography>No Apps found</Typography>
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

const AppsTable: React.FC = () => {
  const { data, isLoading, error } = Hooks.useList(
    {
      listType: Apps.ListTypeEnum.All,
      select: 'allAttributes',
      computeTotal: true,
    },
    { refetchOnWindowFocus: false }
  );

  const appsList: Array<Apps.TapisApp> = data?.result ?? [];

  if (error) {
    return (
      <Box className={styles.errorContainer}>
        <Typography color="error">
          Error loading apps: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.gridContainer}>
      <AppListingTable apps={appsList} isLoading={isLoading} />
    </Box>
  );
};

export default AppsTable;
