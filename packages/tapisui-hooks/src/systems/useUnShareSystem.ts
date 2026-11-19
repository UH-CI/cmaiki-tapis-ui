import { useMutation, MutateOptions, useQueryClient } from 'react-query';
import { Systems } from '@tapis/tapis-typescript';
import { Systems as API } from '@tapis/tapisui-api';
import { useTapisConfig } from '../';
import QueryKeys from './queryKeys';

const useUnShareSystem = () => {
  const { basePath, accessToken } = useTapisConfig();
  const jwt = accessToken?.access_token || '';
  const queryClient = useQueryClient();

  const { mutate, isLoading, isError, error, reset } = useMutation<
    Systems.RespBasic,
    Error,
    Systems.UnShareSystemRequest
  >([QueryKeys.unShareSystem, basePath, jwt], (params) =>
    API.unShareSystem(params, basePath, jwt)
  );

  const invalidate = () => {
    queryClient.invalidateQueries([QueryKeys.details]);
  };

  return {
    isLoading,
    isError,
    error,
    reset,
    invalidate,
    unShare: (
      params: Systems.UnShareSystemRequest,
      options?: MutateOptions<
        Systems.RespBasic,
        Error,
        Systems.UnShareSystemRequest
      >
    ) => mutate(params, options),
  };
};

export default useUnShareSystem;
