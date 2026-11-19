import { jest } from '@jest/globals';
import {
  addAdminRoleUser,
  getAdminRoleUsers,
  removeAdminRoleUser,
} from './roleUsers';

const fetchMock = jest.fn<typeof fetch>();

describe('Admin role user API', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });
  });

  it('lists users assigned to the USER role', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: { names: ['user1', 'user2'] } }),
    } as Response);

    await expect(
      getAdminRoleUsers('https://tacc.develop.tapis.io/', 'token', 'tacc')
    ).resolves.toEqual(['user1', 'user2']);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://tacc.develop.tapis.io/v3/security/user/withRole/cmaiki_admin?tenant=tacc&roleType=USER',
      { headers: { 'X-Tapis-Token': 'token' } }
    );
  });

  it.each([
    ['grantRole', addAdminRoleUser],
    ['revokeRole', removeAdminRoleUser],
  ] as const)(
    '%s updates a user membership with the expected role payload',
    async (operation, updateMember) => {
      fetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);

      await updateMember(
        'https://tacc.develop.tapis.io',
        'token',
        'tacc',
        'new-user'
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `https://tacc.develop.tapis.io/v3/security/user/${operation}`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            tenant: 'tacc',
            user: 'new-user',
            roleType: 'USER',
            roleName: 'cmaiki_admin',
          }),
        })
      );
    }
  );
});
