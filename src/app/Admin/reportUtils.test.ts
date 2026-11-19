import { jest } from '@jest/globals';
import { Files } from '@tapis/tapis-typescript';
import { Files as API } from '@tapis/tapisui-api';
import {
  calculateStorageSizeKb,
  getAdminRolePermissions,
  getProjectReportUsers,
  getProjectStorageSizeKb,
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

  it('totals file sizes in kB without including directory entries', () => {
    expect(
      calculateStorageSizeKb([
        { type: Files.FileTypeEnum.Dir, size: 12 },
        { type: Files.FileTypeEnum.File, size: 1.5 },
        { type: Files.FileTypeEnum.File, size: 2 },
      ])
    ).toBe(3.5);
  });

  it('reports an error when a file size is unavailable', () => {
    expect(() =>
      calculateStorageSizeKb([
        { type: Files.FileTypeEnum.File, path: '/missing-size' },
      ])
    ).toThrow('File size is unavailable for /missing-size.');
  });

  it('paginates recursive file listings when calculating storage size', async () => {
    const list = jest
      .spyOn(API, 'list')
      .mockResolvedValueOnce({
        result: Array.from({ length: 1000 }, () => ({
          type: Files.FileTypeEnum.File,
          size: 1,
        })),
      })
      .mockResolvedValueOnce({
        result: [{ type: Files.FileTypeEnum.File, size: 2.5 }],
      });

    await expect(
      getProjectStorageSizeKb(
        'project-a',
        'https://tacc.develop.tapis.io',
        'token'
      )
    ).resolves.toBe(1002.5);
    expect(list).toHaveBeenNthCalledWith(
      1,
      {
        systemId: 'project-a',
        path: '/',
        recurse: true,
        limit: 1000,
        offset: 0,
      },
      'https://tacc.develop.tapis.io',
      'token'
    );
    expect(list).toHaveBeenNthCalledWith(
      2,
      {
        systemId: 'project-a',
        path: '/',
        recurse: true,
        limit: 1000,
        offset: 1000,
      },
      'https://tacc.develop.tapis.io',
      'token'
    );
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
