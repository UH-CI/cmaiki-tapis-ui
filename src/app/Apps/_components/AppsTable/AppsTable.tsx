import React from "react";
import { useRouteMatch, NavLink } from "react-router-dom";
import { useList } from "@tapis/tapisui-hooks/dist/apps";
import { Apps as Hooks } from "@tapis/tapisui-hooks";
import { Apps } from "@tapis/tapis-typescript";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Box, Typography, CircularProgress, Tooltip } from "@mui/material";
import styles from "./AppsTable.module.scss";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

interface AppListingTableProps {
  apps: Array<Apps.TapisApp>;
  isLoading?: boolean;
}

export const AppListingTable: React.FC<AppListingTableProps> = ({
  apps,
  isLoading = false,
}) => {
  const { url } = useRouteMatch();

  const excludeList: string[] = [""];

  const filteredApps = apps.filter((app) => {
    if (!app || !app.id) {
      return false;
    }
    return !excludeList.includes(app.id);
  });

  const appOrder = [
    "demux-uhhpc",
    "ITS-pipeline-uhhpc",
    "16S-v0.0.2-pipeline-uhhpc",
    "16Sv1-pipeline-uhhpc",
    "ampliseq-ITS-pipeline-uhhpc",
    "ampliseq-16S-pipeline-uhhpc",
    "ampliseq-condensed-pipeline-test",
    "ampliseq-pipeline-test",
  ];

  const sortedApps = filteredApps.sort((a, b) => {
    const indexA = appOrder.indexOf(a.id ?? "");
    const indexB = appOrder.indexOf(b.id ?? "");
    const orderA = indexA === -1 ? appOrder.length : indexA;
    const orderB = indexB === -1 ? appOrder.length : indexB;
    return orderA - orderB;
  });

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Name",
      flex: 1,
      minWidth: 250,
    },
    {
      field: "description",
      headerName: "Short Description",
      flex: 2,
      minWidth: 400,
    },
    {
      field: "version",
      headerName: "App Version",
      flex: 0.5,
      minWidth: 120,
      sortable: false,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.5,
      minWidth: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box className={styles.actionsContainer}>
          <Tooltip title="Run App" arrow placement="top">
            <NavLink
              to={`${url}/${params.row.id}/${params.row.version}`}
              className={styles.actionButton}
            >
              <PlayArrowIcon fontSize="small" />
              <span>Run</span>
            </NavLink>
          </Tooltip>
        </Box>
      ),
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
            params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
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
      select: "allAttributes",
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
