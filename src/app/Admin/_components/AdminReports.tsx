import React, { useState } from 'react';
import { useQueries, useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { Systems as Hooks } from '@tapis/tapisui-hooks';
import { Systems } from '@tapis/tapis-typescript';
import {
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Paper,
  Typography,
} from '@mui/material';
import { useTapisConfig } from '@tapis/tapisui-hooks';
import RouteLoader from '../../_components/RouteLoader/RouteLoader';
import { isProjectSystem } from '../../Projects/projectUtils';
import {
  getAdminRolePermissions,
  getProjectReportUsers,
  getProjectStorageSizeKb,
  projectHasAdminRoleAccess,
} from '../reportUtils';
import { getAdminRoleUsers } from '../roleUsers';

type AdminReportsProps = {
  projectBasePath: string;
};

const formatStorageSize = (sizeKb: number): string =>
  `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    sizeKb
  )} kB`;

const AdminReports: React.FC<AdminReportsProps> = ({ projectBasePath }) => {
  const { basePath, accessToken, claims } = useTapisConfig();
  const token = accessToken?.access_token;
  const tenant = claims['tapis/tenant_id'];
  const history = useHistory();
  const [searchText, setSearchText] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const credentials =
    typeof token === 'string' &&
    typeof tenant === 'string' &&
    token.length > 0 &&
    tenant.length > 0
      ? { token, tenant }
      : undefined;
  const {
    data: systems,
    isLoading: isLoadingSystems,
    error: systemsError,
  } = Hooks.useList({
    listType: Systems.ListTypeEnum.All,
    select: 'allAttributes',
    computeTotal: true,
    limit: 1000,
  });
  const roleUsersQuery = useQuery<string[], Error>(
    ['admin/roleUsers', basePath, credentials?.tenant, token],
    () => {
      if (!credentials) {
        throw new Error('Tapis credentials are required to load role members.');
      }
      return getAdminRoleUsers(basePath, credentials.token, credentials.tenant);
    },
    { enabled: credentials !== undefined }
  );
  const rolePermissionsQuery = useQuery<string[], Error>(
    ['admin/rolePermissions', basePath, credentials?.tenant, token],
    () => {
      if (!credentials) {
        throw new Error(
          'Tapis credentials are required to load role permissions.'
        );
      }
      return getAdminRolePermissions(
        basePath,
        credentials.token,
        credentials.tenant
      );
    },
    { enabled: credentials !== undefined }
  );
  const projectList = (systems?.result ?? []).filter(
    (project): project is Systems.TapisSystem & { id: string } =>
      isProjectSystem(project) && typeof project.id === 'string'
  );
  const rolePermissions = rolePermissionsQuery.data;
  const roleUsers = roleUsersQuery.data;
  const projects =
    credentials && rolePermissions && roleUsers
      ? projectList.filter((project) =>
          projectHasAdminRoleAccess(
            rolePermissions,
            credentials.tenant,
            project.id
          )
        )
      : [];
  const searchTerm = searchText.trim().toLocaleLowerCase();
  const reportRows = projects
    .map((project) => ({
      project,
      users: getProjectReportUsers(project, roleUsers ?? []),
    }))
    .filter(({ project, users }) => {
      if (!searchTerm) return true;
      return [project.id, project.description, ...users].some(
        (value) => value?.toLocaleLowerCase().includes(searchTerm) ?? false
      );
    });
  const storageQueries = useQueries(
    reportRows.map(({ project }) => ({
      queryKey: ['admin/reportStorageKb', basePath, token, project.id],
      queryFn: () => {
        if (!credentials) {
          throw new Error(
            'Tapis credentials are required to read project files.'
          );
        }
        return getProjectStorageSizeKb(project.id, basePath, credentials.token);
      },
      enabled: credentials !== undefined,
      staleTime: 5 * 60 * 1000,
    }))
  );
  const sortedRows = reportRows
    .map((row, index) => ({
      ...row,
      storageQuery: storageQueries[index],
    }))
    .sort((a, b) => {
      const aSize = a.storageQuery?.data;
      const bSize = b.storageQuery?.data;
      if (aSize === undefined && bSize === undefined) {
        return a.project.id.localeCompare(b.project.id);
      }
      if (aSize === undefined) return 1;
      if (bSize === undefined) return -1;
      return sortDirection === 'asc' ? aSize - bSize : bSize - aSize;
    });

  if (!credentials) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Tapis credentials are required to load project reports.
      </Alert>
    );
  }

  if (systemsError || roleUsersQuery.error || rolePermissionsQuery.error) {
    const error =
      systemsError ?? roleUsersQuery.error ?? rolePermissionsQuery.error;
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Could not load project reports: {error?.message}
      </Alert>
    );
  }

  if (
    isLoadingSystems ||
    roleUsersQuery.isLoading ||
    rolePermissionsQuery.isLoading
  ) {
    return <RouteLoader message="Loading project reports..." />;
  }

  return (
    <div style={{ margin: '1rem', overflow: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Project Reports
      </Typography>
      <TextField
        fullWidth
        label="Search by project name or username"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        sx={{ mb: 2 }}
      />
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Users</TableCell>
              <TableCell>
                <TableSortLabel
                  active
                  direction={sortDirection}
                  onClick={() =>
                    setSortDirection((direction) =>
                      direction === 'asc' ? 'desc' : 'asc'
                    )
                  }
                >
                  Storage Size
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map(({ project, users, storageQuery }) => {
              const storageError = storageQuery?.error;
              const storageErrorMessage =
                storageError instanceof Error
                  ? storageError.message
                  : storageError === undefined
                  ? undefined
                  : String(storageError);

              return (
                <TableRow
                  key={project.id}
                  hover
                  role="link"
                  tabIndex={0}
                  sx={{ cursor: 'pointer' }}
                  onClick={() =>
                    history.push(
                      `${projectBasePath}/${encodeURIComponent(project.id)}`
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      history.push(
                        `${projectBasePath}/${encodeURIComponent(project.id)}`
                      );
                    }
                  }}
                >
                  <TableCell>{project.id}</TableCell>
                  <TableCell>{project.description || '—'}</TableCell>
                  <TableCell>{users.join(', ') || '—'}</TableCell>
                  <TableCell
                    title={storageErrorMessage}
                    sx={storageError ? { color: 'error.main' } : undefined}
                  >
                    {storageQuery?.isLoading
                      ? 'Loading…'
                      : storageError
                      ? 'Unavailable'
                      : storageQuery?.data === undefined
                      ? '—'
                      : formatStorageSize(storageQuery.data)}
                  </TableCell>
                </TableRow>
              );
            })}
            {sortedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>No matching projects found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AdminReports;
