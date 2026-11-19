import { PROJECT_ADMIN_ROLE } from '../Projects/projectUtils';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getSecurityApiError = async (
  response: Response,
  fallbackMessage: string
): Promise<Error> => {
  const body: unknown = await response.json();
  const message =
    isRecord(body) && typeof body.message === 'string'
      ? body.message
      : undefined;
  return new Error(message ?? `${fallbackMessage} (${response.status}).`);
};

export const getAdminRoleUsers = async (
  basePath: string,
  accessToken: string,
  tenant: string
): Promise<string[]> => {
  const query = new URLSearchParams({ tenant, roleType: 'USER' });
  const response = await fetch(
    `${basePath.replace(
      /\/+$/,
      ''
    )}/v3/security/user/withRole/${encodeURIComponent(
      PROJECT_ADMIN_ROLE
    )}?${query}`,
    {
      headers: { 'X-Tapis-Token': accessToken },
    }
  );
  const result: unknown = await response.json();

  if (!response.ok) {
    const message =
      isRecord(result) && typeof result.message === 'string'
        ? result.message
        : undefined;
    throw new Error(
      message ?? `Could not retrieve Admin role members (${response.status}).`
    );
  }

  if (!isRecord(result)) {
    throw new Error(
      'The Security API returned an invalid role members response.'
    );
  }

  const roleUsers = isRecord(result.result) ? result.result.names : undefined;
  if (
    !Array.isArray(roleUsers) ||
    !roleUsers.every((name): name is string => typeof name === 'string')
  ) {
    throw new Error(
      'The Security API returned an invalid role members response.'
    );
  }

  return roleUsers;
};

const updateAdminRoleMember = async (
  action: 'grantRole' | 'revokeRole',
  basePath: string,
  accessToken: string,
  tenant: string,
  username: string
): Promise<void> => {
  const response = await fetch(
    `${basePath.replace(/\/+$/, '')}/v3/security/user/${action}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tapis-Token': accessToken,
      },
      body: JSON.stringify({
        tenant,
        user: username,
        roleType: 'USER',
        roleName: PROJECT_ADMIN_ROLE,
      }),
    }
  );

  if (!response.ok) {
    throw await getSecurityApiError(
      response,
      `Could not ${action === 'grantRole' ? 'add' : 'remove'} user ${
        action === 'grantRole' ? 'to' : 'from'
      } the Admin role`
    );
  }
};

export const addAdminRoleUser = (
  basePath: string,
  accessToken: string,
  tenant: string,
  username: string
): Promise<void> =>
  updateAdminRoleMember('grantRole', basePath, accessToken, tenant, username);

export const removeAdminRoleUser = (
  basePath: string,
  accessToken: string,
  tenant: string,
  username: string
): Promise<void> =>
  updateAdminRoleMember('revokeRole', basePath, accessToken, tenant, username);
