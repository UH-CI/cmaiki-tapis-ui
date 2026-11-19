import { jest } from '@jest/globals';
import {
  getAdminRolePermissions,
  getProjectReportUsers,
  projectHasAdminRoleAccess,
} from './reportUtils';

const fetchMock = jest.fn<typeof fetch>();

describe('project report helpers', () => {
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

  it('matches exact and wildcard project permissions for the correct tenant', () => {
    expect(
      projectHasAdminRoleAccess(
        ['system:tacc:read,write:project-a'],
        'tacc',
        'project-a'
      )
    ).toBe(true);
    expect(
      projectHasAdminRoleAccess(
        ['system:tacc:read,write:*'],
        'tacc',
        'project-b'
      )
    ).toBe(true);
    expect(
      projectHasAdminRoleAccess(
        ['system:other:read,write:project-a'],
        'tacc',
        'project-a'
      )
    ).toBe(false);
  });

  it('retrieves permissions for the Admin role from the Security API', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        result: { names: ['system:tacc:read,write:project-a'] },
      }),
    } as Response);

    await expect(
      getAdminRolePermissions('https://tacc.develop.tapis.io/', 'token', 'tacc')
    ).resolves.toEqual(['system:tacc:read,write:project-a']);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://tacc.develop.tapis.io/v3/security/role/cmaiki_admin/perms?tenant=tacc',
      { headers: { 'X-Tapis-Token': 'token' } }
    );
  });

  it('combines owners, shared users, and role members without duplicates', () => {
    expect(
      getProjectReportUsers(
        { owner: 'owner', sharedWithUsers: ['shared', 'owner'] },
        ['role-member', 'shared']
      )
    ).toEqual(['owner', 'role-member', 'shared']);
  });
});
