import { Systems } from '@tapis/tapis-typescript';
import { PROJECT_ADMIN_ROLE } from '../Projects/projectUtils';

export const projectHasAdminRoleAccess = (
  rolePermissions: string[],
  tenant: string,
  systemId: string
): boolean =>
  rolePermissions.some((permission) => {
    const [service, permissionTenant, actions, permissionSystem] =
      permission.split(':');
    const allowedActions = actions?.split(',') ?? [];

    return (
      (service === 'system' || service === '*') &&
      (permissionTenant === tenant || permissionTenant === '*') &&
      (allowedActions.includes('*') ||
        allowedActions.includes('read') ||
        allowedActions.includes('write')) &&
      (permissionSystem === systemId || permissionSystem === '*')
    );
  });

export const getAdminRolePermissions = async (
  basePath: string,
  accessToken: string,
  tenant: string
): Promise<string[]> => {
  const query = new URLSearchParams({ tenant });
  const response = await fetch(
    `${basePath.replace(/\/+$/, '')}/v3/security/role/${encodeURIComponent(
      PROJECT_ADMIN_ROLE
    )}/perms?${query}`,
    {
      headers: { 'X-Tapis-Token': accessToken },
    }
  );
  const result: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof result === 'object' &&
      result !== null &&
      'message' in result &&
      typeof result.message === 'string'
        ? result.message
        : undefined;
    throw new Error(
      message ??
        `Could not retrieve Admin role permissions (${response.status}).`
    );
  }

  if (
    typeof result !== 'object' ||
    result === null ||
    !('result' in result) ||
    typeof result.result !== 'object' ||
    result.result === null ||
    !('names' in result.result) ||
    !Array.isArray(result.result.names) ||
    !result.result.names.every(
      (permission): permission is string => typeof permission === 'string'
    )
  ) {
    throw new Error(
      'The Security API returned an invalid role permissions response.'
    );
  }

  return result.result.names;
};

export const getProjectReportUsers = (
  project: Pick<Systems.TapisSystem, 'owner' | 'sharedWithUsers'>,
  roleUsers: string[]
): string[] =>
  [
    ...new Set(
      [project.owner, ...(project.sharedWithUsers ?? []), ...roleUsers].filter(
        (username): username is string => Boolean(username)
      )
    ),
  ].sort((a, b) => a.localeCompare(b));
