import { authError, fakeAuthGateway } from '@/features/auth/application/testing/fakes';

import type { PersonalData } from '@/features/auth/domain';

import type { AccountGateway, ProfileRepository, Usuario } from '../domain';
import { changePassword, deleteAccount, updatePersonalData } from './accountUseCases';

function fakeAccountGateway(overrides: Partial<AccountGateway> = {}): jest.Mocked<AccountGateway> {
  return { deleteAccount: jest.fn(async () => undefined), ...overrides } as jest.Mocked<AccountGateway>;
}

function fakeProfileRepository(): jest.Mocked<ProfileRepository> {
  return {
    get: jest.fn<Promise<Usuario | null>, [string]>(async () => null),
    updatePersonalData: jest.fn<Promise<void>, [string, PersonalData]>(async () => undefined),
  };
}

describe('updatePersonalData', () => {
  it('saves the personal data of the user', async () => {
    const profiles = fakeProfileRepository();
    const data = { firstName: 'Ana', lastName: 'Torres', birthDate: '1998-07-14', cityId: 'loja', idNumber: '' };
    await updatePersonalData('uid-1', data, { profiles });
    expect(profiles.updatePersonalData).toHaveBeenCalledWith('uid-1', data);
  });
});

describe('changePassword', () => {
  const input = { currentPassword: 'Old12345', newPassword: 'New12345', confirmNewPassword: 'New12345' };

  it('re-authenticates with the current password before updating it', async () => {
    const auth = fakeAuthGateway();
    await changePassword(input, { auth });
    expect(auth.reauthenticate).toHaveBeenCalledWith('Old12345');
    expect(auth.updatePassword).toHaveBeenCalledWith('New12345');
    expect(auth.reauthenticate.mock.invocationCallOrder[0]).toBeLessThan(
      auth.updatePassword.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('does not update the password when the current one is wrong', async () => {
    const auth = fakeAuthGateway({
      reauthenticate: jest.fn(async () => {
        throw authError('auth/invalid-credential');
      }),
    });
    await expect(changePassword(input, { auth })).rejects.toMatchObject({ code: 'auth/invalid-credential' });
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });
});

describe('deleteAccount', () => {
  it('re-authenticates, deletes the account on the server and signs out', async () => {
    const auth = fakeAuthGateway();
    const account = fakeAccountGateway();

    await deleteAccount({ password: 'Secret123', confirmed: true }, { auth, account });

    expect(auth.reauthenticate).toHaveBeenCalledWith('Secret123');
    expect(account.deleteAccount).toHaveBeenCalledTimes(1);
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(auth.reauthenticate.mock.invocationCallOrder[0]).toBeLessThan(
      account.deleteAccount.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('deletes nothing when the password is wrong', async () => {
    const auth = fakeAuthGateway({
      reauthenticate: jest.fn(async () => {
        throw authError('auth/wrong-password');
      }),
    });
    const account = fakeAccountGateway();

    await expect(deleteAccount({ password: 'nope', confirmed: true }, { auth, account })).rejects.toMatchObject({
      code: 'auth/wrong-password',
    });
    expect(account.deleteAccount).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('keeps the session when the server deletion fails', async () => {
    const auth = fakeAuthGateway();
    const account = fakeAccountGateway({
      deleteAccount: jest.fn(async () => {
        throw authError('functions/unavailable');
      }),
    });

    await expect(deleteAccount({ password: 'Secret123', confirmed: true }, { auth, account })).rejects.toMatchObject({
      code: 'functions/unavailable',
    });
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('succeeds even if the local sign-out fails after the account is gone', async () => {
    const auth = fakeAuthGateway({
      signOut: jest.fn(async () => {
        throw authError('auth/network-request-failed');
      }),
    });
    await expect(
      deleteAccount({ password: 'Secret123', confirmed: true }, { auth, account: fakeAccountGateway() }),
    ).resolves.toBeUndefined();
  });
});
