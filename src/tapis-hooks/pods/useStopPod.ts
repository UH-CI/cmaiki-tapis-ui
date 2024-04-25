import { useMutation, MutateOptions } from 'react-query';
import { Pods } from '@tapis/tapis-typescript';
import { stopPod } from '../../tapis-api/pods';
import { useTapisConfig } from '../context';
import QueryKeys from './queryKeys';

type StopPodHookParams = {
  podId: string;
};

const useStopPod = () => {
  const { basePath, accessToken } = useTapisConfig();
  const jwt = accessToken?.access_token || '';

  // The useMutation react-query hook is used to call operations that make server-side changes
  // (Other hooks would be used for data retrieval)
  //
  // In this case, mkdir helper is called to perform the operation
  const { mutate, isLoading, isError, isSuccess, data, error, reset } =
    useMutation<Pods.PodResponse, Error, StopPodHookParams>(
      [QueryKeys.stopPod, basePath, jwt],
      ({ podId }) => stopPod(podId, basePath, jwt)
    );

  // Return hook object with loading states and login function
  return {
    isLoading,
    isError,
    isSuccess,
    data,
    error,
    reset,
    stopPod: (
      podId: string,
      // react-query options to allow callbacks such as onSuccess
      options?: MutateOptions<Pods.PodResponse, Error, StopPodHookParams>
    ) => {
      // Call mutate to trigger a single post-like API operation
      return mutate({ podId }, options);
    },
  };
};

export default useStopPod;
