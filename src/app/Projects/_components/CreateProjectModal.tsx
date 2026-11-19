import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { Systems as Hooks, useTapisConfig } from '@tapis/tapisui-hooks';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import {
  createProjectAdminRole,
  createProjectSystemRequest,
  grantProjectAdminRolePermission,
  PROJECT_ADMIN_ROLE,
} from '../projectUtils';

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
};

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [isPreparingRole, setIsPreparingRole] = useState(false);
  const { makeNewSystem, isLoading, reset } = Hooks.useMakeNewSystem();
  const { basePath, accessToken, claims } = useTapisConfig();
  const queryClient = useQueryClient();
  const isCreating = isPreparingRole || isLoading;

  const clearForm = () => {
    setName('');
    setDescription('');
    setSubmitError(undefined);
    setIsPreparingRole(false);
    reset();
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(undefined);

    if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(name)) {
      setSubmitError(
        "Project name must be 1-80 characters and contain only letters, numbers, '.', '_' or '-'."
      );
      return;
    }

    if (description.length > 2048) {
      setSubmitError('Description must be 2048 characters or fewer.');
      return;
    }

    const tenant = claims['tapis/tenant_id'];
    const jwt = accessToken?.access_token;
    if (typeof tenant !== 'string' || !tenant || !jwt) {
      setSubmitError('A valid Tapis tenant and access token are required.');
      return;
    }

    setIsPreparingRole(true);
    try {
      await createProjectAdminRole(basePath, jwt, tenant);
    } catch (error) {
      setIsPreparingRole(false);
      setSubmitError(
        `Could not create or verify the ${PROJECT_ADMIN_ROLE} role: ${
          error instanceof Error ? error.message : 'Unknown Security API error.'
        }`
      );
      return;
    }
    setIsPreparingRole(false);

    makeNewSystem(createProjectSystemRequest(name, description), true, {
      onSuccess: async () => {
        queryClient.invalidateQueries([Hooks.queryKeys.list]);
        try {
          await grantProjectAdminRolePermission(basePath, jwt, tenant, name);
        } catch (error) {
          setSubmitError(
            `Project created, but could not grant ${PROJECT_ADMIN_ROLE} MODIFY permission: ${
              error instanceof Error
                ? error.message
                : 'Unknown Security API error.'
            }`
          );
          return;
        }

        handleClose();
      },
      onError: (error) => {
        setSubmitError(error.message);
      },
    });
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={isCreating ? undefined : handleClose}
      aria-labelledby="create-project-title"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle id="create-project-title">Create Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            required
            margin="dense"
            label="Project Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            inputProps={{ maxLength: 80 }}
            helperText="This will also be the project system ID and storage folder name."
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            margin="dense"
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            inputProps={{ maxLength: 2048 }}
          />
          {submitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submitError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <LoadingButton onClick={handleClose} disabled={isCreating}>
            Cancel
          </LoadingButton>
          <LoadingButton type="submit" variant="contained" loading={isCreating}>
            Create New Project
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateProjectModal;
