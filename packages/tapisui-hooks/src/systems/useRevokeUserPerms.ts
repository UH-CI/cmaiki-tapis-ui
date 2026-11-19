import { useMutation, MutateOptions, useQueryClient } from 'react-query';
import { Systems } from '@tapis/tapis-typescript';
import { Systems as API } from '@tapis/tapisui-api';
import { useTapisConfig } from '../';
import QueryKeys from './queryKeys';

const useRevokeUserPerms = () => {
  const { basePath, accessToken } = useTapisConfig();
  const jwt = accessToken?.access_token || '';
  const queryClient = useQueryClient();

  const { mutate, isLoading, isError, error, reset } = useMutation<
    Systems.RespBasic,
    Error,
    Systems.RevokeUserPermsRequest
  >([QueryKeys.revokeUserPerms, basePath, jwt], (params) =>
    API.revokeUserPerms(params, basePath, jwt)
  );

  const invalidate = () => {
    queryClient.invalidateQueries([QueryKeys.details]);
    queryClient.invalidateQueries([QueryKeys.getUserPerms]);
  };

  return {
    isLoading,
    isError,
    error,
    reset,
    invalidate,
    revoke: (
      params: Systems.RevokeUserPermsRequest,
      options?: MutateOptions<
        Systems.RespBasic,
        Error,
        Systems.RevokeUserPermsRequest
      >
    ) => mutate(params, options),
  };
};

export default useRevokeUserPerms;
