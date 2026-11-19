import { jest } from '@jest/globals';
import {
  ADMIN_ACCESS_USERNAMES,
  getUserRoles,
  hasAdminAccess,
} from './adminAccess';

const fetchMock = jest.fn<typeof fetch>();

describe('admin access', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });
  });

  it('allows the configured usernames without a role lookup', () => {
    expect(ADMIN_ACCESS_USERNAMES).toEqual(['seanbc', 'andyyu']);
    expect(hasAdminAccess('seanbc')).toBe(true);
    expect(hasAdminAccess('andyyu')).toBe(true);
  });

  it('allows users with the project admin role', () => {
    expect(hasAdminAccess('someone-else', ['cmaiki_admin'])).toBe(true);
  });

  it('denies access to other users', () => {
    expect(hasAdminAccess('someone-else')).toBe(false);
    expect(hasAdminAccess(undefined, [])).toBe(false);
  });

  it('looks up user roles in the Tapis Security API', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: { names: ['cmaiki_admin'] } }),
    } as Response);

    await expect(
      getUserRoles(
        'https://tacc.develop.tapis.io/',
        'token',
        'tacc',
        'someone-else'
      )
    ).resolves.toEqual(['cmaiki_admin']);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://tacc.develop.tapis.io/v3/security/user/roles/someone-else?tenant=tacc',
      { headers: { 'X-Tapis-Token': 'token' } }
    );
  });
});
