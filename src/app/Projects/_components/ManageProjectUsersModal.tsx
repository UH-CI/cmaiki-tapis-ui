import React, { useState } from 'react';
import { Systems as Hooks } from '@tapis/tapisui-hooks';
import { Systems } from '@tapis/tapis-typescript';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';

type ManageProjectUsersModalProps = {
  open: boolean;
  onClose: () => void;
  project: Systems.TapisSystem;
};

const ProjectUserRow: React.FC<{
  systemId: string;
  username: string;
  isOwner: boolean;
  onRemove: (username: string, permissions: string[]) => void;
}> = ({ systemId, username, isOwner, onRemove }) => {
  const { data, isLoading, error } = Hooks.useGetUserPerms({
    systemId,
    userName: username,
  });
  const permissions = data?.result?.names ?? [];
  const displayPermission = isOwner
    ? 'Owner'
    : permissions.includes('MODIFY')
    ? 'Write'
    : permissions.includes('READ')
    ? 'Read'
    : 'No permissions';

  return (
    <TableRow>
      <TableCell>{username}</TableCell>
      <TableCell>
        {isLoading ? 'Loading…' : error ? error.message : displayPermission}
      </TableCell>
      <TableCell align="right">
        {!isOwner && (
          <Button
            color="error"
            disabled={isLoading || Boolean(error)}
            onClick={() => onRemove(username, permissions)}
          >
            Remove User
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

const ManageProjectUsersModal: React.FC<ManageProjectUsersModalProps> = ({
  open,
  onClose,
  project,
}) => {
  const [username, setUsername] = useState('');
  const [permission, setPermission] = useState<'READ' | 'MODIFY'>('READ');
  const [userToRemove, setUserToRemove] = useState<{
    username: string;
    permissions: string[];
  }>();
  const [removeError, setRemoveError] = useState<string>();
  const [shareError, setShareError] = useState<string>();
  const {
    share,
    isLoading: isSharing,
    isError: isShareError,
    error: shareMutationError,
    reset: resetShare,
    invalidate: invalidateAfterShare,
  } = Hooks.useShareSystem();
  const {
    grant,
    isLoading: isGranting,
    isError: isAddError,
    error: addError,
    reset: resetAdd,
    invalidate: invalidateAfterAdd,
  } = Hooks.useGrantUserPerms();
  const {
    unShare,
    isLoading: isUnsharing,
    invalidate: invalidateAfterUnshare,
  } = Hooks.useUnShareSystem();
  const {
    revoke,
    isLoading: isRemoving,
    isError: isRevokeError,
    error: revokeError,
    reset: resetRevoke,
    invalidate: invalidateAfterRemove,
  } = Hooks.useRevokeUserPerms();

  const users = [
    ...new Set(
      [project.owner, ...(project.sharedWithUsers ?? [])].filter(
        (name): name is string => Boolean(name)
      )
    ),
  ];
  const trimmedUsername = username.trim();
  const isExistingUser = users.includes(trimmedUsername);
  const isAdding = isSharing || isGranting;
  const submitError =
    shareError ??
    (isAddError ? addError?.message : undefined) ??
    (isShareError ? shareMutationError?.message : undefined);

  const handleAddUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedUsername || !project.id) return;
    setShareError(undefined);
    const sharedUsers = project.sharedWithUsers ?? [];

    share(
      {
        systemId: project.id,
        reqShareUpdate: {
          users: [...new Set([...sharedUsers, trimmedUsername])],
        },
      },
      {
        onSuccess: () => {
          invalidateAfterShare();
          grant(
            {
              systemId: project.id!,
              userName: trimmedUsername,
              reqPerms: { permissions: [permission] },
            },
            {
              onSuccess: () => {
                setUsername('');
                resetAdd();
                resetShare();
                invalidateAfterAdd();
              },
              onError: (error) => setShareError(error.message),
            }
          );
        },
        onError: (error) => setShareError(error.message),
      }
    );
  };

  const handleConfirmRemoval = () => {
    if (!userToRemove || !project.id) return;
    setRemoveError(undefined);
    const unshareUser = () =>
      unShare(
        {
          systemId: project.id!,
          reqShareUpdate: { users: [userToRemove.username] },
        },
        {
          onSuccess: () => {
            setUserToRemove(undefined);
            invalidateAfterUnshare();
          },
          onError: (error) => setRemoveError(error.message),
        }
      );

    if (userToRemove.permissions.length === 0) {
      unshareUser();
      return;
    }

    revoke(
      {
        systemId: project.id,
        userName: userToRemove.username,
        reqPerms: { permissions: userToRemove.permissions },
      },
      {
        onSuccess: () => {
          invalidateAfterRemove();
          unshareUser();
        },
        onError: (error) => setRemoveError(error.message),
      }
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={isAdding ? undefined : onClose}
        fullWidth
        maxWidth="md"
        aria-labelledby="manage-project-users-title"
      >
        <DialogTitle id="manage-project-users-title">
          Manage Project Users
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleAddUser}>
            <TextField
              fullWidth
              margin="dense"
              label="Username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                resetAdd();
                resetShare();
                setShareError(undefined);
              }}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel id="project-permission-label">Permission</InputLabel>
              <Select<'READ' | 'MODIFY'>
                labelId="project-permission-label"
                label="Permission"
                value={permission}
                onChange={(event) => setPermission(event.target.value)}
              >
                <MenuItem value="READ">Read</MenuItem>
                <MenuItem value="MODIFY">Write</MenuItem>
              </Select>
            </FormControl>
            {isExistingUser && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                This user already has access. Adding them again updates their
                permission.
              </Alert>
            )}
            {submitError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {submitError}
              </Alert>
            )}
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isAdding}
              disabled={!trimmedUsername}
              sx={{ mt: 1 }}
            >
              Add User To Project
            </LoadingButton>
          </form>

          <Table size="small" sx={{ mt: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Permission</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <ProjectUserRow
                  key={user}
                  systemId={project.id!}
                  username={user}
                  isOwner={user === project.owner}
                  onRemove={(userToRemove, permissions) => {
                    resetRevoke();
                    setRemoveError(undefined);
                    setUserToRemove({ username: userToRemove, permissions });
                  }}
                />
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>No users have access.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isAdding}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(userToRemove)}
        onClose={
          isRemoving || isUnsharing
            ? undefined
            : () => setUserToRemove(undefined)
        }
        aria-labelledby="confirm-project-user-removal-title"
      >
        <DialogTitle id="confirm-project-user-removal-title">
          Confirm User Removal
        </DialogTitle>
        <DialogContent>
          Are you sure you want to remove {userToRemove?.username} from the
          project?
          {removeError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {removeError}
            </Alert>
          )}
          {isRevokeError && revokeError && !removeError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {revokeError.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUserToRemove(undefined);
              setRemoveError(undefined);
            }}
            disabled={isRemoving || isUnsharing}
          >
            Cancel
          </Button>
          <LoadingButton
            color="error"
            variant="contained"
            loading={isRemoving || isUnsharing}
            onClick={handleConfirmRemoval}
          >
            Confirm Removal
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ManageProjectUsersModal;
