import { restoreSessionRole } from './restoreSessionRole';
import { fakeAuthGateway } from './testing/fakes';

const authError = (code: string) => Object.assign(new Error(code), { code });

describe('restoreSessionRole', () => {
  it('returns the role from a fresh token when the session is valid', async () => {
    const gateway = fakeAuthGateway({ getRole: jest.fn(async () => 'runner') });

    await expect(restoreSessionRole(gateway)).resolves.toBe('runner');
    expect(gateway.getRole).toHaveBeenCalledWith(true);
    expect(gateway.signOut).not.toHaveBeenCalled();
  });

  it.each(['auth/invalid-refresh-token', 'auth/user-not-found', 'auth/user-disabled', 'auth/user-token-expired'])(
    'signs out when the stored session is dead (%s)',
    async (code) => {
      const gateway = fakeAuthGateway({ getRole: jest.fn(async () => Promise.reject(authError(code))) });

      await expect(restoreSessionRole(gateway)).resolves.toBeNull();
      expect(gateway.signOut).toHaveBeenCalledTimes(1);
    },
  );

  it('falls back to the cached token when the network is unavailable', async () => {
    const getRole = jest.fn(async (forceRefresh: boolean) => {
      if (forceRefresh) throw authError('auth/network-request-failed');
      return 'admin';
    });
    const gateway = fakeAuthGateway({ getRole });

    await expect(restoreSessionRole(gateway)).resolves.toBe('admin');
    expect(getRole).toHaveBeenLastCalledWith(false);
    expect(gateway.signOut).not.toHaveBeenCalled();
  });

  it('returns null without signing out when even the cached token fails', async () => {
    const gateway = fakeAuthGateway({
      getRole: jest.fn(async () => Promise.reject(authError('auth/network-request-failed'))),
    });

    await expect(restoreSessionRole(gateway)).resolves.toBeNull();
    expect(gateway.signOut).not.toHaveBeenCalled();
  });
});
