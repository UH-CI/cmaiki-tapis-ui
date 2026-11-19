import { Systems } from '@tapis/tapis-typescript';
import { ReqPostSystem } from '@tapis/tapis-typescript-systems';
import { projectStorageConfig } from './projectStorage.config';

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
