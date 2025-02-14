import React, { useState } from "react";
import styles from "./JobsTable.module.scss";
import { useRouteMatch, NavLink, useHistory } from "react-router-dom";
import { useList, useDetails } from "@tapis/tapisui-hooks/dist/jobs";
import { Jobs } from "@tapis/tapis-typescript";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";

const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);

  if (isNaN(date.getTime())) {
    return "---";
  }

  const formattedDate = date
    .toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Pacific/Honolulu", // HST timezone
    })
    .replace(",", "");
  return formattedDate;
};

interface JobListingTableProps {
  jobs: Array<Jobs.JobListDTO>;
  isLoading?: boolean;
}

export const JobListingTable: React.FC<JobListingTableProps> = ({
  jobs,
  isLoading = false,
}) => {
  const [jobUuid, setJobUuid] = useState("");
  const { data: jobDetails, isLoading: isDetailLoading } = useDetails(jobUuid);
  const history = useHistory();
  const { url } = useRouteMatch();

  const handleOutputView = (uuid: string) => {
    if (uuid !== jobUuid) {
      setJobUuid(uuid);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 250,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.7,
      minWidth: 120,
    },
    {
      field: "created",
      headerName: "Created",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => <span>{formatDateTime(params.row.created)}</span>,
    },
    {
      field: "ended",
      headerName: "Ended",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => <span>{formatDateTime(params.row.ended)}</span>,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      minWidth: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box className={styles.actionsContainer}>
          <Tooltip title="View Details" arrow placement="top">
            <IconButton
              component={NavLink}
              to={`${url}/${params.row.uuid}`}
              size="small"
              className={styles.actionButton}
            >
              <DescriptionIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Output Files" arrow placement="top">
            <IconButton
              onClick={() => handleOutputView(params.row.uuid)}
              size="small"
              className={styles.actionButton}
            >
              <FolderIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const rows = jobs.map((job) => ({
    ...job,
    id: job.uuid,
  }));

  return (
    <Box className={styles.tableContainer}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        pagination
        getRowClassName={(params) =>
          `MuiDataGrid-row--${
            params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
          }`
        }
        paginationMode="client"
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        disableRowSelectionOnClick
        slots={{
          noRowsOverlay: () => (
            <Box className={styles.noRowsOverlay}>
              <Typography>No Jobs found</Typography>
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

const JobsTable: React.FC = () => {
  const { data, isLoading, error } = useList();
  const jobsList: Array<Jobs.JobListDTO> = data?.result ?? [];

  if (error) {
    return (
      <Box className={styles.errorContainer}>
        <Typography color="error">
          Error loading jobs: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.gridContainer}>
      <JobListingTable jobs={jobsList} isLoading={isLoading} />
    </Box>
  );
};

export default JobsTable;
