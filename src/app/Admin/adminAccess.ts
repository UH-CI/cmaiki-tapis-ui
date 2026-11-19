import { useQuery } from 'react-query';
import { useTapisConfig } from '@tapis/tapisui-hooks';
import { PROJECT_ADMIN_ROLE } from '../Projects/projectUtils';

export const ADMIN_ACCESS_USERNAMES = ['seanbc', 'andyyu'];

export const hasAdminAccess = (
  username: string | undefined,
  roles: string[] = []
): boolean =>
  (username !== undefined && ADMIN_ACCESS_USERNAMES.includes(username)) ||
  roles.includes(PROJECT_ADMIN_ROLE);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const getUserRoles = async (
  basePath: string,
  accessToken: string,
  tenant: string,
  username: string
): Promise<string[]> => {
  const query = new URLSearchParams({ tenant });
  const response = await fetch(
    `${basePath.replace(
      /\/+$/,
      ''
    )}/v3/security/user/roles/${encodeURIComponent(username)}?${query}`,
    {
      headers: { 'X-Tapis-Token': accessToken },
    }
  );
  const result: unknown = await response.json();

  if (!isRecord(result)) {
    throw new Error(
      'The Security API returned an invalid user roles response.'
    );
  }

  if (!response.ok) {
    const message =
      typeof result.message === 'string' ? result.message : undefined;
    throw new Error(
      message ?? `Could not verify Admin access (${response.status}).`
    );
  }

  const roleNames = isRecord(result.result) ? result.result.names : undefined;
  if (
    !Array.isArray(roleNames) ||
    !roleNames.every((role): role is string => typeof role === 'string')
  ) {
    throw new Error(
      'The Security API returned an invalid user roles response.'
    );
  }

  return roleNames;
};

const useAdminAccess = () => {
  const { basePath, accessToken, claims } = useTapisConfig();
  const username = claims['tapis/username'];
  const tenant = claims['tapis/tenant_id'];
  const token = accessToken?.access_token;
  const isAllowlisted =
    typeof username === 'string' && ADMIN_ACCESS_USERNAMES.includes(username);
  const roleLookupParameters =
    typeof username === 'string' &&
    typeof tenant === 'string' &&
    typeof token === 'string' &&
    token.length > 0 &&
    !isAllowlisted
      ? { username, tenant, token }
      : undefined;
  const {
    data: roles,
    isLoading,
    error,
  } = useQuery<string[], Error>(
    ['admin/userRoles', basePath, tenant, username, token],
    () => {
      if (!roleLookupParameters) {
        throw new Error('Cannot verify Admin access without user credentials.');
      }
      return getUserRoles(
        basePath,
        roleLookupParameters.token,
        roleLookupParameters.tenant,
        roleLookupParameters.username
      );
    },
    {
      enabled: roleLookupParameters !== undefined,
      staleTime: 5 * 60 * 1000,
    }
  );

  return {
    hasAccess: hasAdminAccess(
      typeof username === 'string' ? username : undefined,
      roles
    ),
    isLoading: roleLookupParameters !== undefined && isLoading,
    error: roleLookupParameters ? error : undefined,
  };
};

export default useAdminAccess;
