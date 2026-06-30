import { useEffect } from 'react';
import { useMutation, MutateOptions } from 'react-query';
import { Jobs } from '@tapis/tapis-typescript';
import { Jobs as API } from '@tapis/tapisui-api';
import { useTapisConfig } from '../';
import QueryKeys from './queryKeys';

// Share all jobs (READ) with cmaiki_service account
const JOB_SHARE_GRANTEE = 'cmaiki_service';

const useSubmit = (appId: string, appVersion: string) => {
  const { basePath, accessToken } = useTapisConfig();
  const jwt = accessToken?.access_token || '';

  // The useMutation react-query hook is used to call operations that make server-side changes
  // (Other hooks would be used for data retrieval)
  //
  // In this case, submit helper is called to perform the operation
  const { mutate, isLoading, isError, isSuccess, data, error, reset } =
    useMutation<Jobs.RespSubmitJob, Error, Jobs.ReqSubmitJob>(
      [QueryKeys.submit, appId, appVersion, basePath, jwt],
      (request: Jobs.ReqSubmitJob) => API.submit(request, basePath, jwt),
      {
        onSuccess: (response) => {
          const jobUuid = response.result?.uuid;
          if (!jobUuid) {
            return;
          }
          API.shareJob(
            jobUuid,
            {
              grantee: JOB_SHARE_GRANTEE,
              jobPermission: Jobs.ReqShareJobJobPermissionEnum.Read,
              jobResource: [
                Jobs.ReqShareJobJobResourceEnum.History,
                Jobs.ReqShareJobJobResourceEnum.ResubmitRequest,
                Jobs.ReqShareJobJobResourceEnum.Output,
                Jobs.ReqShareJobJobResourceEnum.Input,
              ],
            },
            basePath,
            jwt
          )
            .then((shareResponse) => {
              // TODO: remove temp success console log
              console.log(
                `Shared job ${jobUuid} with ${JOB_SHARE_GRANTEE}`,
                shareResponse
              );
            })
            .catch((shareError) => {
              console.error(
                `Failed to share job ${jobUuid} with ${JOB_SHARE_GRANTEE}`,
                shareError
              );
            });
        },
      }
    );

  // We want this hook to automatically reset if a different appId or appVersion
  // is passed to it. This eliminates the need to reset it inside the TSX component
  useEffect(() => reset(), [reset, appId, appVersion]);

  // Return hook object with loading states and login function
  return {
    isLoading,
    isError,
    isSuccess,
    data,
    error,
    reset,
    submit: (
      request: Jobs.ReqSubmitJob,
      options?: MutateOptions<Jobs.RespSubmitJob, Error, Jobs.ReqSubmitJob>
    ) => {
      // Call mutate to trigger a single post-like API operation
      return mutate(request, options);
    },
  };
};

export default useSubmit;
