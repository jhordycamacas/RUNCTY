import { FakeFirebaseAuthGateway } from '../../core/auth/testing/fake-firebase-auth.gateway';
import { ApiError } from '../../core/errors/api-error';
import { AccountRepository } from '../domain/profile';
import { changePassword, deleteAccount } from './account-use-cases';

describe('changePassword', () => {
  const input = {
    currentPassword: 'Old12345',
    newPassword: 'New12345',
    confirmNewPassword: 'New12345',
  };

  it('re-authenticates with the current password before updating it', async () => {
    const auth = new FakeFirebaseAuthGateway();

    await changePassword(input, { auth });

    expect(auth.calls).toEqual(['reauthenticate:Old12345', 'updatePassword:New12345']);
  });

  it('does not update the password when the current one is wrong', async () => {
    const auth = new FakeFirebaseAuthGateway();
    auth.failures.reauthenticate = { code: 'auth/invalid-credential' };

    await expect(changePassword(input, { auth })).rejects.toEqual({
      code: 'auth/invalid-credential',
    });

    expect(auth.calls).toEqual(['reauthenticate:Old12345']);
  });
});

describe('deleteAccount', () => {
  let auth: FakeFirebaseAuthGateway;
  let calls: string[];
  let account: AccountRepository;
  let signOut: () => Promise<void>;

  beforeEach(() => {
    auth = new FakeFirebaseAuthGateway();
    calls = auth.calls;
    account = {
      delete: async () => {
        calls.push('api:delete');
      },
    };
    signOut = async () => {
      calls.push('signOut');
    };
  });

  const run = () =>
    deleteAccount({ password: 'Secret123', confirmed: true }, { auth, account, signOut });

  it('re-authenticates, refreshes the token, deletes the account on the server and signs out', async () => {
    await run();

    expect(calls).toEqual([
      'reauthenticate:Secret123',
      'getIdToken:forced',
      'api:delete',
      'signOut',
    ]);
  });

  it('deletes nothing when the password is wrong', async () => {
    auth.failures.reauthenticate = { code: 'auth/wrong-password' };

    await expect(run()).rejects.toEqual({ code: 'auth/wrong-password' });

    expect(calls).toEqual(['reauthenticate:Secret123']);
  });

  it('keeps the session when the server refuses because the sign-in is not recent', async () => {
    const stale = new ApiError(412, 'recent-sign-in-required', 'x');
    account = { delete: () => Promise.reject(stale) };

    await expect(run()).rejects.toBe(stale);

    expect(calls).not.toContain('signOut');
  });

  it('succeeds even if the local sign-out fails after the account is gone', async () => {
    signOut = () => Promise.reject(new Error('network'));

    await expect(run()).resolves.toBeUndefined();
  });
});
