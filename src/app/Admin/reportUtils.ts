import { Files } from '@tapis/tapis-typescript';
import { Files as API } from '@tapis/tapisui-api';
import { Systems } from '@tapis/tapis-typescript';
import { PROJECT_ADMIN_ROLE } from '../Projects/projectUtils';

const PAGE_SIZE = 1000;

const withStorageRequestLimit: <T>(task: () => Promise<T>) => Promise<T> =
  (() => {
    let activeRequests = 0;
    const waitingRequests: Array<() => void> = [];

    return async <T>(task: () => Promise<T>): Promise<T> => {
      if (activeRequests >= 5) {
        await new Promise<void>((resolve) => waitingRequests.push(resolve));
      }

      activeRequests += 1;
      try {
        return await task();
      } finally {
        activeRequests -= 1;
        waitingRequests.shift()?.();
      }
    };
  })();

export const calculateStorageSizeKb = (entries: Files.FileInfo[]): number =>
  entries.reduce((total, entry) => {
    if (entry.type === Files.FileTypeEnum.Dir) return total;
    if (
      typeof entry.size !== 'number' ||
      !Number.isFinite(entry.size) ||
      entry.size < 0
    ) {
      throw new Error(
        `File size is unavailable for ${entry.path ?? entry.name ?? 'an item'}.`
      );
    }
    return total + entry.size;
  }, 0);

export const getProjectStorageSizeKb = async (
  systemId: string,
  basePath: string,
  accessToken: string
): Promise<number> => {
  let offset = 0;
  let totalSizeKb = 0;

  while (true) {
    const response = await withStorageRequestLimit(() =>
      API.list(
        {
          systemId,
          path: '/',
          recurse: true,
          limit: PAGE_SIZE,
          offset,
        },
        basePath,
        accessToken
      )
    );
    const entries = response.result;
    if (!entries) {
      throw new Error(
        `The Files API returned an invalid listing for project ${systemId}.`
      );
    }

    totalSizeKb += calculateStorageSizeKb(entries);
    if (entries.length < PAGE_SIZE) return totalSizeKb;
    offset += entries.length;
  }
};

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
