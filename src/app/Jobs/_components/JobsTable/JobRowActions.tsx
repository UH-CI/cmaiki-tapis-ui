import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, IconButton, Tooltip } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import { Jobs } from '@tapis/tapis-typescript';
import { ConfirmModal } from '@tapis/tapisui-common';
import useDeleteJob, {
  canDeleteJob,
  deleteJobMessage,
} from 'app/Jobs/_hooks/useDeleteJob';
import styles from './JobsTable.module.scss';

type JobRowActionsProps = {
  job: Jobs.JobListDTO;
  url: string;
};

const JobRowActions: React.FC<JobRowActionsProps> = ({ job, url }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { deleteJob, isDeleting, isSuccess, error, reset } = useDeleteJob();
  const deletable = canDeleteJob(job.status);

  const toggle = () => {
    setModalOpen(false);
    reset();
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
      <Tooltip
        title={
          deletable
            ? 'Delete Job'
            : 'Only finished, failed or cancelled jobs can be deleted'
        }
        arrow
        placement="top"
      >
        {/* Tooltips need a wrapper element to appear over a disabled button */}
        <span>
          <IconButton
            onClick={() => setModalOpen(true)}
            disabled={!deletable}
            size="small"
            className={styles.actionButton}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      {modalOpen && (
        <ConfirmModal
          toggle={toggle}
          title="Delete Job"
          message={deleteJobMessage()}
          onConfirm={() => deleteJob(job.uuid!)}
          isLoading={isDeleting}
          isSuccess={isSuccess}
          isError={!!error}
          error={error}
        />
      )}
    </Box>
  );
};

export default JobRowActions;
