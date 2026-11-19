import { Systems } from '@tapis/tapis-typescript';
import { ReqPostSystem } from '@tapis/tapis-typescript-systems';
import { projectStorageConfig } from './projectStorage.config';

export const PROJECT_ADMIN_ROLE = 'cmaiki-admin';

export const isProjectSystem = (system: Systems.TapisSystem): boolean =>
  system.id !== undefined &&
  system.canExec === false &&
  system.canRunBatch !== true &&
  system.deleted !== true;

export const getProjectRootDir = (projectName: string): string => {
  const baseRootDir = projectStorageConfig.baseRootDir.replace(/\/+$/, '');
  return `${baseRootDir}/${projectName}`;
};

export const createProjectSystemRequest = (
  projectName: string,
  description: string
): ReqPostSystem => ({
  id: projectName,
  description,
  systemType: projectStorageConfig.systemType,
  host: projectStorageConfig.host,
  defaultAuthnMethod: projectStorageConfig.defaultAuthnMethod,
  effectiveUserId: projectStorageConfig.effectiveUserId,
  rootDir: getProjectRootDir(projectName),
  canExec: false,
  canRunBatch: false,
});

const postSecurityRequest = async (
  basePath: string,
  accessToken: string,
  path: string,
  body: object
): Promise<void> => {
  const response = await fetch(
    `${basePath.replace(/\/+$/, '')}/v3/security/${path}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tapis-Token': accessToken,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    throw new Error(
      error.message ?? `Security API request failed (${response.status}).`
    );
  }
};

export const createProjectAdminRole = async (
  basePath: string,
  accessToken: string,
  tenant: string
): Promise<void> =>
  postSecurityRequest(basePath, accessToken, 'role', {
    roleTenant: tenant,
    roleType: 'USER',
    roleName: PROJECT_ADMIN_ROLE,
    description: 'Administrator role for TapisUI project systems.',
  });

export const grantProjectAdminRolePermission = async (
  basePath: string,
  accessToken: string,
  tenant: string,
  systemId: string
): Promise<void> =>
  postSecurityRequest(basePath, accessToken, 'role/addPerm', {
    roleTenant: tenant,
    roleType: 'USER',
    roleName: PROJECT_ADMIN_ROLE,
    permSpec: `system:${tenant}:read,write:${systemId}`,
  });
