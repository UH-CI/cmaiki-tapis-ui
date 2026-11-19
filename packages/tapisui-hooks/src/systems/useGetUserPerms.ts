import { useQuery, QueryObserverOptions } from 'react-query';
import { Systems as API } from '@tapis/tapisui-api';
import { Systems } from '@tapis/tapis-typescript';
import { useTapisConfig } from '../';
import QueryKeys from './queryKeys';

const useGetUserPerms = (
  params: Systems.GetUserPermsRequest,
  options: QueryObserverOptions<Systems.RespNameArray, Error> = {}
) => {
  const { accessToken, basePath } = useTapisConfig();
  const result = useQuery<Systems.RespNameArray, Error>(
    [QueryKeys.getUserPerms, params, accessToken],
    () => API.getUserPerms(params, basePath, accessToken?.access_token || ''),
    {
      ...options,
      enabled: !!accessToken,
    }
  );
  return result;
};

export default useGetUserPerms;
