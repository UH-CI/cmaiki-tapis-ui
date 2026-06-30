import { useMutation, MutateOptions } from 'react-query';
import { Jobs } from '@tapis/tapis-typescript';
import { Jobs as API } from '@tapis/tapisui-api';
import { useTapisConfig } from '../context';
import QueryKeys from './queryKeys';

type ShareJobHookParams = {
  jobUuid: string;
  reqShareJob: Jobs.ReqShareJob;
};

const useShareJob = () => {
  const { basePath, accessToken } = useTapisConfig();
  const jwt = accessToken?.access_token || '';

  // The useMutation react-query hook is used to call operations that make server-side changes
  // (Other hooks would be used for data retrieval)
  const { mutate, isLoading, isError, isSuccess, data, error, reset } =
    useMutation<Jobs.RespShareJob, Error, ShareJobHookParams>(
      [QueryKeys.shareJob, basePath, jwt],
      ({ jobUuid, reqShareJob }) =>
        API.shareJob(jobUuid, reqShareJob, basePath, jwt)
    );

  // Return hook object with loading states and login function
  return {
    isLoading,
    isError,
    isSuccess,
    data,
    error,
    reset,
    shareJob: (
      jobUuid: string,
      reqShareJob: Jobs.ReqShareJob,
      // react-query options to allow callbacks such as onSuccess
      options?: MutateOptions<Jobs.RespShareJob, Error, ShareJobHookParams>
    ) => {
      // Call mutate to trigger a single post-like API operation
      return mutate({ jobUuid, reqShareJob }, options);
    },
  };
};

export default useShareJob;