import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Jobs as Hooks, Files as FileHooks } from '@tapis/tapisui-hooks';
import { Jobs } from '@tapis/tapis-typescript';
import { Divider } from '@mui/material';
import {
  FileListing,
  SystemProvider,
  useSystem,
  QueryWrapper,
  JSONDisplay,
  JobStatusIcon,
  JobTypeChip,
  jobTerminalStatuses,
  jobRunningStatuses,
  ConfirmModal,
} from '@tapis/tapisui-common';
import styles from './JobDetail.module.scss';
import {
  DataObject,
  Apps,
  Dns,
  Storage,
  Replay,
  Dangerous,
  DeleteForever,
} from '@mui/icons-material';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { LoadingButton as Button } from '@mui/lab';
import { useQueryClient } from 'react-query';
import Toolbar from 'app/Files/_components/Toolbar';
import {
  FilesProvider,
  useFilesSelect,
} from 'app/Files/_components/FilesContext';

const createJobDisplay = (job: any) => {
  const keysToPrettyPrint = ['parameterSet', 'fileInputs', 'notes'];
  const jobDisplay: { [key: string]: any } = {};

  for (const key in job) {
    if (keysToPrettyPrint.includes(key) && typeof job[key] === 'string') {
      try {
        jobDisplay[key] = JSON.parse(job[key]);
      } catch (e) {
        jobDisplay[key] = job[key];
      }
    } else {
      jobDisplay[key] = job[key];
    }
  }

  return jobDisplay;
};

const JobOutputList: React.FC<{ job: Jobs.Job }> = ({ job }) => {
  const system = useSystem();
  const { selectedFiles, select, unselect, clear } = useFilesSelect();

  const handlePathChange = (newPath: string) => {
    clear(); // Clear selections when path changes
  };

  return (
    <div>
      <div style={{ paddingBottom: '16px' }}>
        {/*<Toolbar*/}
        {/*  systemId={job.execSystemId!}*/}
        {/*  currentPath={job.execSystemOutputDir!}*/}
        {/*/>*/}
        <Toolbar
          systemId={job.archiveSystemId!}
          currentPath={job.archiveSystemDir!}
        />
      </div>
      <FileListing
        // systemId={job.execSystemId!}
        // path={job.execSystemOutputDir!}
        // location={`/files/${job.execSystemId!}${job.execSystemOutputDir}`}
        systemId={job.archiveSystemId!}
        path={job.archiveSystemDir!}
        location={`/files/${job.archiveSystemId!}${job.archiveSystemDir}`}
        selectMode={{ mode: 'multi', types: ['dir', 'file'] }}
        selectedFiles={selectedFiles}
        onSelect={(files) => select(files, 'multi')}
        onUnselect={unselect}
        onPathChange={handlePathChange}
      />
    </div>
  );
};

const JobDetail: React.FC<{ jobUuid: string }> = ({ jobUuid }) => {
  const [isCanceled, setIsCanceled] = useState(false);
  const [showJSON, setShowJSON] = useState(false);
  const [refetchInterval, setRefetchInterval] = useState(5);
  const { data, isLoading, error } = Hooks.useDetails(jobUuid, {
    refetchInterval: refetchInterval * 1000,
  });
  const job: Jobs.Job | undefined = useMemo(() => data?.result, [data]);
  const { resubmit, isLoading: isLoadingResubmit } = Hooks.useResubmit({
    jobUuid,
  });
  const {
    cancel,
    isLoading: cancelIsLoading,
    isSuccess: cancelIsSuccess,
    reset: cancelReset,
  } = Hooks.useCancel();
  const jobDisplay = job ? createJobDisplay(job) : undefined;
  const history = useHistory();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileDeleteError, setFileDeleteError] = useState<Error | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isDeletingRef = useRef(false);
  const queryClient = useQueryClient();
  const { deleteFileAsync } = FileHooks.useDelete();
  const {
    hideJob,
    isError: isHideError,
    isSuccess: isHideSuccess,
    error: hideError,
    reset: resetHide,
  } = Hooks.useHideJob();

  const toggleDeleteModal = () => {
    setDeleteModalOpen(false);
    setFileDeleteError(null);
    resetHide();
  };

  const handleDeleteJob = async () => {
    if (isDeletingRef.current) {
      return;
    }
    isDeletingRef.current = true;
    setIsDeleting(true);
    setFileDeleteError(null);
    try {
      if (job?.archiveSystemId && job?.archiveSystemDir) {
        await deleteFileAsync({
          systemId: job.archiveSystemId,
          path: job.archiveSystemDir,
        });
      }
    } catch (e) {
      // File deletion failing shouldn't block hiding the job from the list,
      // but the user should still be told the files may not have been removed.
      setFileDeleteError(e as Error);
    }
    hideJob(job?.uuid!, {
      onSuccess: () => {
        queryClient.invalidateQueries(Hooks.queryKeys.list);
        history.push('/jobs');
      },
      // Released on failure too, so the user can retry from the open modal.
      onSettled: () => {
        isDeletingRef.current = false;
        setIsDeleting(false);
      },
    });
  };

  useEffect(() => {
    if (jobTerminalStatuses.includes(job?.status!)) {
      return;
    }

    if (
      refetchInterval === 5 &&
      job?.status &&
      !jobRunningStatuses.includes(job?.status)
    ) {
      setRefetchInterval(10);
      return;
    }

    if (jobRunningStatuses.includes(job?.status!)) {
      setRefetchInterval(refetchInterval * 1.5);
    }
  }, [data]);

  const renderJobOutput = useCallback(() => {
    return (
      <div className={styles['container']}>
        <FilesProvider>
          <SystemProvider systemId={job?.execSystemId!}>
            <JobOutputList job={job!} />
          </SystemProvider>
        </FilesProvider>
      </div>
    );
  }, [job]);

  return (
    <QueryWrapper isLoading={isLoading} error={error}>
      <div className={styles['cards-container']}>
        <div className={styles['card']}>
          <div className={styles['flex-space-between']}>
            <div className={styles['card-line']}>
              <JobStatusIcon
                status={
                  isCanceled ? Jobs.JobStatusEnum.Cancelled : job?.status!
                }
                animation={
                  [
                    Jobs.JobStatusEnum.Running,
                    Jobs.JobListDTOStatusEnum.Running,
                  ].includes(job?.status!)
                    ? 'rotate'
                    : undefined
                }
              />
              {job?.name}
              <JobTypeChip size="small" jobType={job?.jobType!} />
              <span className={styles['muted']}>{job?.uuid}</span>
            </div>
            <div></div>
            <div>
              <Button
                size="small"
                startIcon={<DataObject />}
                onClick={() => {
                  setShowJSON(!showJSON);
                }}
                variant="text"
              >
                {!showJSON ? 'Show JSON' : 'Hide JSON'}
              </Button>
            </div>
          </div>
          <div className={styles['card-line']}>
            <Apps />
            <Link
              style={{ color: '#333333' }}
              to={`/apps/${job?.appId}/${job?.appVersion}`}
            >
              {job?.appId!}:{job?.appVersion!}
            </Link>
            <span className={styles['muted']}>app:appVersion</span>
          </div>
          <div className={styles['card-line']}>
            <Dns />
            <Link
              style={{ color: '#333333' }}
              to={`/systems/${job?.execSystemId!}`}
            >
              {job?.execSystemId!}
            </Link>
            <span className={styles['muted']}>execution system</span>
          </div>
          {job?.archiveSystemId && (
            <div className={styles['card-line']}>
              <Storage />
              <Link
                style={{ color: '#333333' }}
                to={`/systems/${job?.archiveSystemId!}`}
              >
                {job.archiveSystemId}
              </Link>
              <span className={styles['muted']}>archive system</span>
            </div>
          )}
          <Divider />
          <div className={styles['flex-space-between']}>
            <div className={styles['flex']}>
              {jobTerminalStatuses.includes(job?.status!) ? (
                <Button
                  size="small"
                  startIcon={<Replay />}
                  disabled={
                    !jobTerminalStatuses.includes(job?.status!) ||
                    isLoadingResubmit
                  }
                  onClick={() => {
                    resubmit({
                      onSuccess: (values) => {
                        history.push(`/jobs/${values.result?.uuid}`);
                      },
                    });
                    cancelReset();
                  }}
                >
                  Resubmit
                </Button>
              ) : (
                <Button
                  size="small"
                  startIcon={<Dangerous />}
                  loading={cancelIsLoading}
                  disabled={cancelIsLoading || cancelIsSuccess}
                  color="error"
                  onClick={() => {
                    setIsCanceled(true);
                    cancel(
                      { jobUuid: job?.uuid! },
                      {
                        onSuccess: () => {
                          setRefetchInterval(5);
                        },
                      }
                    );
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="small"
                startIcon={<DeleteForever />}
                disabled={isDeleting}
                color="error"
                onClick={() => setDeleteModalOpen(true)}
              >
                Delete Job
              </Button>
            </div>
            <div></div>
            <div></div>
          </div>
          {deleteModalOpen && (
            <ConfirmModal
              toggle={toggleDeleteModal}
              title="Delete Job"
              message="This will permanently delete all files in this job's output directory and remove the job from your list. This cannot be undone."
              onConfirm={handleDeleteJob}
              isLoading={isDeleting}
              isSuccess={isHideSuccess}
              isError={isHideError || !!fileDeleteError}
              error={hideError ?? fileDeleteError}
            />
          )}
          {showJSON && jobDisplay && (
            <div>
              <Divider />
              <JSONDisplay json={jobDisplay} />
            </div>
          )}
        </div>
      </div>
      {job &&
        job.status! &&
        jobTerminalStatuses.includes(job?.status!) &&
        renderJobOutput()}
    </QueryWrapper>
  );
};

export default JobDetail;
