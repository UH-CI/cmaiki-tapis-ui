import { useQuery, QueryObserverOptions } from 'react-query';
import { Systems as API } from '@tapis/tapisui-api';
import { Systems } from '@tapis/tapis-typescript';
import { useTapisConfig } from '../';
import QueryKeys from './queryKeys';

export const defaultParams: Systems.GetSystemsRequest = {
  listType: Systems.ListTypeEnum.All,
};

const useList = (
  params: Systems.GetSystemsRequest = defaultParams,
  options: QueryObserverOptions<Systems.RespSystems, Error> = {}
) => {
  const { accessToken, basePath } = useTapisConfig();

  // Debug the inputs
  console.log('useList called with:', {
    params,
    hasAccessToken: !!accessToken,
    hasTokenString: !!accessToken?.access_token,
    basePath,
    enabled: !!accessToken,
  });

  const result = useQuery<Systems.RespSystems, Error>(
    [QueryKeys.list, params, accessToken],
    // Default to no token. This will generate a 403 when calling the list function
    // which is expected behavior for not having a token
    () => {
      console.log('useQuery function executing with:', {
        params,
        basePath,
        tokenLength: accessToken?.access_token?.length || 0,
      });

      return API.list(params, basePath, accessToken?.access_token || '');
    },
    {
      ...options,
      enabled: !!accessToken,
      onSuccess: (data) => {
        console.log('Systems API success:', {
          hasResult: !!data?.result,
          resultLength: data?.result?.length,
          resultType: Array.isArray(data?.result)
            ? 'array'
            : typeof data?.result,
          fullData: data,
          resultData: data?.result,
        });
      },
      onError: (error) => {
        console.error('Systems API error:', error);
      },
    }
  );

  // Debug the result
  console.log('useList result:', {
    isLoading: result.isLoading,
    isError: result.isError,
    hasData: !!result.data,
    error: result.error?.message,
    data: result.data,
  });

  return result;
};

export default useList;
