import React, { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, IconButton, Tooltip } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import { Jobs } from '@tapis/tapis-typescript';
import { Jobs as JobsAPI } from '@tapis/tapisui-api';
import { Jobs as JobHooks, Files as FileHooks } from '@tapis/tapisui-hooks';
import { useTapisConfig } from '@tapis/tapisui-hooks';
import { ConfirmModal } from '@tapis/tapisui-common';
import { useQueryClient } from 'react-query';
import styles from './JobsTable.module.scss';

type JobRowActionsProps = {
  job: Jobs.JobListDTO;
  url: string;
};

const JobRowActions: React.FC<JobRowActionsProps> = ({ job, url }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [fileDeleteError, setFileDeleteError] = useState<Error | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isDeletingRef = useRef(false);
  const { basePath, accessToken } = useTapisConfig();
  const jwt = accessToken?.access_token ?? '';
  const queryClient = useQueryClient();
  const { deleteFileAsync } = FileHooks.useDelete();
  const {
    hideJob,
    isError: isHideError,
    isSuccess: isHideSuccess,
    error: hideError,
    reset: resetHide,
  } = JobHooks.useHideJob();

  const toggle = () => {
    setModalOpen(false);
    setFileDeleteError(null);
    resetHide();
  };

  const handleDelete = async () => {
    if (isDeletingRef.current) {
      return;
    }
    isDeletingRef.current = true;
    setIsDeleting(true);
    setFileDeleteError(null);
    try {
      const { result: fullJob } = await JobsAPI.details(
        { jobUuid: job.uuid! },
        basePath,
        jwt
      );
      if (fullJob?.archiveSystemId && fullJob?.archiveSystemDir) {
        await deleteFileAsync({
          systemId: fullJob.archiveSystemId,
          path: fullJob.archiveSystemDir,
        });
      }
    } catch (e) {
      // File deletion failing shouldn't block hiding the job from the list,
      // but the user should still be told the files may not have been removed.
      setFileDeleteError(e as Error);
    }
    hideJob(job.uuid!, {
      onSuccess: () => {
        queryClient.invalidateQueries(JobHooks.queryKeys.list);
      },
      // Released on failure too, so the user can retry from the open modal.
      onSettled: () => {
        isDeletingRef.current = false;
        setIsDeleting(false);
      },
    });
  };

  return (
    <Box className={styles.actionsContainer}>
      <Tooltip title="View Details" arrow placement="top">
        <IconButton
          component={NavLink}
          to={`${url}/${job.uuid}`}
          size="small"
          className={styles.actionButton}
        >
          <DescriptionIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete Job" arrow placement="top">
        <IconButton
          onClick={() => setModalOpen(true)}
          size="small"
          className={styles.actionButton}
          color="error"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {modalOpen && (
        <ConfirmModal
          toggle={toggle}
          title="Delete Job"
          message="This will permanently delete all files in this job's output directory and remove the job from your list. This cannot be undone."
          onConfirm={handleDelete}
          isLoading={isDeleting}
          isSuccess={isHideSuccess}
          isError={isHideError || !!fileDeleteError}
          error={hideError ?? fileDeleteError}
        />
      )}
    </Box>
  );
};

export default JobRowActions;
