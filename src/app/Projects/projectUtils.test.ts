import {
  createProjectSystemRequest,
  getProjectRootDir,
  isProjectSystem,
} from './projectUtils';
import { projectStorageConfig } from './projectStorage.config';

describe('project system helpers', () => {
  it('creates a storage-only system using the configured host and project directory', () => {
    expect(
      createProjectSystemRequest('my-project', 'Project description')
    ).toEqual({
      id: 'my-project',
      description: 'Project description',
      systemType: projectStorageConfig.systemType,
      host: projectStorageConfig.host,
      defaultAuthnMethod: projectStorageConfig.defaultAuthnMethod,
      effectiveUserId: projectStorageConfig.effectiveUserId,
      rootDir: '/my-project',
      canExec: false,
      canRunBatch: false,
    });
  });

  it('appends project names to a base directory without duplicate separators', () => {
    expect(getProjectRootDir('sample')).toBe('/sample');
  });

  it('only treats non-executable systems as projects', () => {
    expect(
      isProjectSystem({
        id: 'storage',
        canExec: false,
        canRunBatch: false,
      })
    ).toBe(true);
    expect(
      isProjectSystem({
        id: 'compute',
        canExec: true,
        canRunBatch: true,
      })
    ).toBe(false);
  });
});
