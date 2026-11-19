import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useTapisConfig } from '@tapis/tapisui-hooks';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import RouteLoader from '../../_components/RouteLoader/RouteLoader';
import {
  addAdminRoleUser,
  getAdminRoleUsers,
  removeAdminRoleUser,
} from '../roleUsers';
import { PROJECT_ADMIN_ROLE } from '../../Projects/projectUtils';

const AdminRoleUsers: React.FC = () => {
  const { basePath, accessToken, claims } = useTapisConfig();
  const token = accessToken?.access_token;
  const tenant = claims['tapis/tenant_id'];
  const [username, setUsername] = useState('');
  const [userToRemove, setUserToRemove] = useState<string>();
  const queryClient = useQueryClient();
  const credentials =
    typeof token === 'string' &&
    typeof tenant === 'string' &&
    token.length > 0 &&
    tenant.length > 0
      ? { token, tenant }
      : undefined;
  const queryKey = ['admin/roleUsers', basePath, credentials?.tenant, token];
  const {
    data: users,
    isLoading,
    error: usersError,
  } = useQuery<string[], Error>(
    queryKey,
    () => {
      if (!credentials) {
        throw new Error('Tapis credentials are required to load role members.');
      }
      return getAdminRoleUsers(basePath, credentials.token, credentials.tenant);
    },
    { enabled: credentials !== undefined }
  );
  const {
    mutate: addUser,
    isLoading: isAdding,
    error: addError,
    reset: resetAdd,
  } = useMutation<void, Error, string>(
    (newUsername) => {
      if (!credentials) {
        throw new Error('Tapis credentials are required to add role members.');
      }
      return addAdminRoleUser(
        basePath,
        credentials.token,
        credentials.tenant,
        newUsername
      );
    },
    {
      onSuccess: () => {
        setUsername('');
        queryClient.invalidateQueries(queryKey);
      },
    }
  );
  const {
    mutate: removeUser,
    isLoading: isRemoving,
    error: removeError,
    reset: resetRemove,
  } = useMutation<void, Error, string>(
    (removedUsername) => {
      if (!credentials) {
        throw new Error(
          'Tapis credentials are required to remove role members.'
        );
      }
      return removeAdminRoleUser(
        basePath,
        credentials.token,
        credentials.tenant,
        removedUsername
      );
    },
    {
      onSuccess: () => {
        setUserToRemove(undefined);
        queryClient.invalidateQueries(queryKey);
      },
    }
  );

  const trimmedUsername = username.trim();
  const isExistingUser = users?.includes(trimmedUsername) ?? false;

  const handleAddUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedUsername || isExistingUser) return;
    addUser(trimmedUsername);
  };

  if (isLoading) {
    return <RouteLoader message="Loading Admin role members..." />;
  }

  if (!credentials) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Tapis credentials are required to manage Admin role members.
      </Alert>
    );
  }

  if (usersError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Could not load Admin role members: {usersError.message}
      </Alert>
    );
  }

  return (
    <>
      <div style={{ margin: '1rem', overflow: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Manage Admin Role Members
        </Typography>
        <form onSubmit={handleAddUser}>
          <TextField
            fullWidth
            margin="dense"
            label="Username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              resetAdd();
            }}
          />
          {isExistingUser && (
            <Alert severity="info" sx={{ mt: 1 }}>
              This user is already a member of {PROJECT_ADMIN_ROLE}.
            </Alert>
          )}
          {addError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              Could not add user: {addError.message}
            </Alert>
          )}
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isAdding}
            disabled={!trimmedUsername || isExistingUser}
            sx={{ mt: 1 }}
          >
            Add User To Role
          </LoadingButton>
        </form>

        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(users ?? []).map((member) => (
                <TableRow key={member}>
                  <TableCell>{member}</TableCell>
                  <TableCell align="right">
                    <Button
                      color="error"
                      disabled={isAdding || isRemoving}
                      onClick={() => {
                        resetRemove();
                        setUserToRemove(member);
                      }}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2}>
                    No users have the Admin role.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <Dialog
        open={Boolean(userToRemove)}
        onClose={isRemoving ? undefined : () => setUserToRemove(undefined)}
        aria-labelledby="confirm-admin-role-removal-title"
      >
        <DialogTitle id="confirm-admin-role-removal-title">
          Remove Admin Role
        </DialogTitle>
        <DialogContent>
          Are you sure you want to remove {userToRemove} from the{' '}
          {PROJECT_ADMIN_ROLE} role?
          {removeError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Could not remove user: {removeError.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setUserToRemove(undefined)}
            disabled={isRemoving}
          >
            Cancel
          </Button>
          <LoadingButton
            color="error"
            variant="contained"
            loading={isRemoving}
            onClick={() => {
              if (userToRemove) removeUser(userToRemove);
            }}
          >
            Confirm Removal
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminRoleUsers;
