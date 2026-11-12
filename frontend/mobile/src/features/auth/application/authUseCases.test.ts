import { registerUser, requestPasswordReset, signIn } from './authUseCases';
import { authError, fakeAuthGateway, fakeUserDocGateway } from './testing/fakes';

const input = {
  firstName: 'Ana',
  lastName: 'Torres',
  email: 'ana@runcty.dev',
  password: 'Runner2026',
  confirmPassword: 'Runner2026',
  birthDate: '1998-07-14',
  cityId: 'loja',
  idNumber: '',
  acceptsLopdp: true,
};

describe('registerUser', () => {
  it('creates the auth account, then the user doc without a role, then asks for verification', async () => {
    const auth = fakeAuthGateway();
    const users = fakeUserDocGateway();

    const user = await registerUser({ ...input, idNumber: '1104567890' }, { auth, users });

    expect(user.uid).toBe('uid-1');
    expect(auth.signUp).toHaveBeenCalledWith('ana@runcty.dev', 'Runner2026');
    expect(users.createUserDoc).toHaveBeenCalledWith({
      uid: 'uid-1',
      email: 'ana@runcty.dev',
      firstName: 'Ana',
      lastName: 'Torres',
      birthDate: '1998-07-14',
      cityId: 'loja',
      idNumber: '1104567890',
    });
    expect(auth.sendEmailVerification).toHaveBeenCalled();
  });

  it('omits an empty id number', async () => {
    const users = fakeUserDocGateway();
    await registerUser(input, { auth: fakeAuthGateway(), users });
    expect(users.createUserDoc.mock.calls[0]?.[0]).not.toHaveProperty('idNumber');
  });

  it('deletes the auth account when the user doc cannot be created (no orphans)', async () => {
    const auth = fakeAuthGateway();
    const users = fakeUserDocGateway({
      createUserDoc: jest.fn(async () => {
        throw authError('permission-denied');
      }),
    });

    await expect(registerUser(input, { auth, users })).rejects.toMatchObject({ code: 'permission-denied' });
    expect(auth.deleteCurrentUser).toHaveBeenCalledTimes(1);
    expect(auth.sendEmailVerification).not.toHaveBeenCalled();
  });

  it('reports the original error even if the rollback also fails', async () => {
    const auth = fakeAuthGateway({
      deleteCurrentUser: jest.fn(async () => {
        throw authError('auth/network-request-failed');
      }),
    });
    const users = fakeUserDocGateway({
      createUserDoc: jest.fn(async () => {
        throw authError('unavailable');
      }),
    });

    await expect(registerUser(input, { auth, users })).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('does not create anything else when the email is already in use', async () => {
    const auth = fakeAuthGateway({
      signUp: jest.fn(async () => {
        throw authError('auth/email-already-in-use');
      }),
    });
    const users = fakeUserDocGateway();

    await expect(registerUser(input, { auth, users })).rejects.toMatchObject({ code: 'auth/email-already-in-use' });
    expect(users.createUserDoc).not.toHaveBeenCalled();
    expect(auth.deleteCurrentUser).not.toHaveBeenCalled();
  });

  it('does not fail the sign-up when the verification email cannot be sent', async () => {
    const auth = fakeAuthGateway({
      sendEmailVerification: jest.fn(async () => {
        throw authError('auth/too-many-requests');
      }),
    });
    await expect(registerUser(input, { auth, users: fakeUserDocGateway() })).resolves.toMatchObject({ uid: 'uid-1' });
  });
});

describe('signIn', () => {
  it('delegates to the auth gateway', async () => {
    const auth = fakeAuthGateway();
    await signIn({ email: 'ana@runcty.dev', password: 'x' }, { auth });
    expect(auth.signIn).toHaveBeenCalledWith('ana@runcty.dev', 'x');
  });
});

describe('requestPasswordReset', () => {
  it('sends the reset email', async () => {
    const auth = fakeAuthGateway();
    await requestPasswordReset({ email: 'ana@runcty.dev' }, { auth });
    expect(auth.sendPasswordReset).toHaveBeenCalledWith('ana@runcty.dev');
  });

  it('does not reveal whether the account exists', async () => {
    const auth = fakeAuthGateway({
      sendPasswordReset: jest.fn(async () => {
        throw authError('auth/user-not-found');
      }),
    });
    await expect(requestPasswordReset({ email: 'ghost@runcty.dev' }, { auth })).resolves.toBeUndefined();
  });

  it('still surfaces network problems', async () => {
    const auth = fakeAuthGateway({
      sendPasswordReset: jest.fn(async () => {
        throw authError('auth/network-request-failed');
      }),
    });
    await expect(requestPasswordReset({ email: 'ana@runcty.dev' }, { auth })).rejects.toMatchObject({
      code: 'auth/network-request-failed',
    });
  });
});
