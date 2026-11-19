import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { Systems as Hooks } from '@tapis/tapisui-hooks';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { createProjectSystemRequest } from '../projectUtils';

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
  const { makeNewSystem, isLoading, reset } = Hooks.useMakeNewSystem();
  const queryClient = useQueryClient();

  const clearForm = () => {
    setName('');
    setDescription('');
    setSubmitError(undefined);
    reset();
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

    makeNewSystem(createProjectSystemRequest(name, description), true, {
      onSuccess: () => {
        queryClient.invalidateQueries([Hooks.queryKeys.list]);
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
      onClose={isLoading ? undefined : handleClose}
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
          <LoadingButton onClick={handleClose} disabled={isLoading}>
            Cancel
          </LoadingButton>
          <LoadingButton type="submit" variant="contained" loading={isLoading}>
            Create New Project
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateProjectModal;
