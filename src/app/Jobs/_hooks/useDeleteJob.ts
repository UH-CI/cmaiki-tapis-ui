import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import { Jobs } from '@tapis/tapis-typescript';
import { Jobs as JobsAPI, Files as FilesAPI } from '@tapis/tapisui-api';
import { Jobs as JobHooks, useTapisConfig } from '@tapis/tapisui-hooks';
import { jobTerminalStatuses } from '@tapis/tapisui-common';

type JobStatus = Jobs.JobStatusEnum | Jobs.JobListDTOStatusEnum;

// Only jobs that have stopped (finished, failed or cancelled) can be deleted.
export const canDeleteJob = (status?: JobStatus): boolean =>
  !!status && jobTerminalStatuses.includes(status);

// Archive folder is only deleted when its path names this job.
// This protects against a job whose archive folder was set to a shared location, such as a project or home folder.
const isJobSpecificFolder = (folder: string, jobUuid: string): boolean =>
  folder.includes(jobUuid);

// Tapis reports a missing folder as a "not found" error.
const isNotFoundError = (e: unknown): boolean =>
  /not[\s_-]?found|does not exist|no such file/i.test(
    (e as Error)?.message ?? ''
  );

export const deleteJobMessage = (archiveFolder?: string): string =>
  archiveFolder
    ? `This will permanently delete the folder "${archiveFolder}" and everything in it, then remove the job from your list. This cannot be undone.`
    : "This will permanently delete this job's saved output files, then remove the job from your list. This cannot be undone.";

// Deletes a job's archived output files, then hides the job from the job list.
const useDeleteJob = () => {
  const { basePath, accessToken } = useTapisConfig();
  const jwt = accessToken?.access_token ?? '';
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Double click won't initiate a second deletion
  const inProgress = useRef(false);

  const reset = useCallback(() => {
    setIsSuccess(false);
    setError(null);
  }, []);

  // Resolves to true if the job was fully deleted, false otherwise.
  const deleteJob = useCallback(
    async (jobUuid: string): Promise<boolean> => {
      if (inProgress.current) {
        return false;
      }
      inProgress.current = true;
      setIsDeleting(true);
      setIsSuccess(false);
      setError(null);
      try {
        // Fetch fresh details so the checks below use the job's current state.
        const { result: job } = await JobsAPI.details(
          { jobUuid },
          basePath,
          jwt
        );
        if (!job) {
          throw new Error('Could not load the job details. Please try again.');
        }
        if (!canDeleteJob(job.status)) {
          throw new Error(
            `This job is still ${job.status}. Cancel it or wait for it to finish before deleting it.`
          );
        }

        const { archiveSystemId, archiveSystemDir } = job;
        if (archiveSystemId && archiveSystemDir) {
          if (!isJobSpecificFolder(archiveSystemDir, jobUuid)) {
            throw new Error(
              `Nothing was deleted. This job's archive folder "${archiveSystemDir}" is not specific to this job, so deleting it could remove other files. Please remove this job's files by hand.`
            );
          }
          try {
            await FilesAPI.deleteFile(
              archiveSystemId,
              archiveSystemDir,
              basePath,
              jwt
            );
          } catch (e) {
            if (!isNotFoundError(e)) {
              throw new Error(
                `The job's files could not be deleted, so the job was kept: ${
                  (e as Error)?.message ?? e
                }`
              );
            }
          }
        }

        await JobsAPI.hideJob(jobUuid, basePath, jwt);
        setIsSuccess(true);
        queryClient.invalidateQueries(JobHooks.queryKeys.list);
        return true;
      } catch (e) {
        setError(e as Error);
        return false;
      } finally {
        inProgress.current = false;
        setIsDeleting(false);
      }
    },
    [basePath, jwt, queryClient]
  );

  return { deleteJob, isDeleting, isSuccess, error, reset };
};

export default useDeleteJob;
