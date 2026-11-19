import { jest } from '@jest/globals';
import {
  createProjectAdminRole,
  createProjectSystemRequest,
  grantProjectAdminRolePermission,
  getProjectRootDir,
  isProjectSystem,
  PROJECT_SYSTEM_TAG,
} from './projectUtils';
import { projectStorageConfig } from './projectStorage.config';

const fetchMock = jest.fn<typeof fetch>();

describe('project system helpers', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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
      tags: ['cmaiki_project'],
    });
  });

  it('appends project names to a base directory without duplicate separators', () => {
    expect(getProjectRootDir('sample')).toBe('/sample');
  });

  it('only treats tagged, non-executable systems as projects', () => {
    expect(
      isProjectSystem({
        id: 'storage',
        canExec: false,
        canRunBatch: false,
        tags: [PROJECT_SYSTEM_TAG],
      })
    ).toBe(true);
    expect(
      isProjectSystem({
        id: 'untagged-storage',
        canExec: false,
        canRunBatch: false,
      })
    ).toBe(false);
    expect(
      isProjectSystem({
        id: 'compute',
        canExec: true,
        canRunBatch: true,
        tags: [PROJECT_SYSTEM_TAG],
      })
    ).toBe(false);
  });

  it('creates the project admin role through the Security API', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201 } as Response);

    await createProjectAdminRole(
      'https://tacc.develop.tapis.io/',
      'token',
      'tacc'
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://tacc.develop.tapis.io/v3/security/role',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          roleTenant: 'tacc',
          roleType: 'USER',
          roleName: 'cmaiki_admin',
          description: 'Administrator role for TapisUI project systems.',
        }),
      })
    );
  });

  it('grants the project admin role write access to the project system', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);

    await grantProjectAdminRolePermission(
      'https://tacc.develop.tapis.io',
      'token',
      'tacc',
      'my-project'
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://tacc.develop.tapis.io/v3/security/role/addPerm',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          roleTenant: 'tacc',
          roleType: 'USER',
          roleName: 'cmaiki_admin',
          permSpec: 'system:tacc:read,write:my-project',
        }),
      })
    );
  });
});
