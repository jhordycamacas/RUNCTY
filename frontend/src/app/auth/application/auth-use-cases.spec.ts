import type { Mock } from 'vitest';
import { FakeFirebaseAuthGateway } from '../../core/auth/testing/fake-firebase-auth.gateway';
import { NewUserProfile, UsersRepository } from '../domain/ports';
import { RegisterInput } from '../domain/registration';
import { registerUser, requestPasswordReset } from './auth-use-cases';

const input: RegisterInput = {
  firstName: ' Ana ',
  lastName: 'Torres',
  email: ' Ana@Runcty.dev ',
  password: 'Runner2026',
  confirmPassword: 'Runner2026',
  birthDate: '1998-07-14',
  cityId: 'loja',
  idNumber: '',
  acceptsLopdp: true,
};

class FakeUsers extends UsersRepository {
  readonly created: NewUserProfile[] = [];
  failure: unknown = null;

  async create(profile: NewUserProfile): Promise<void> {
    this.created.push(profile);
    if (this.failure) throw this.failure;
  }
}

describe('registerUser', () => {
  let auth: FakeFirebaseAuthGateway;
  let users: FakeUsers;
  let session: { refreshSession: Mock<() => Promise<void>> };

  beforeEach(() => {
    auth = new FakeFirebaseAuthGateway();
    users = new FakeUsers();
    session = { refreshSession: vi.fn<() => Promise<void>>().mockResolvedValue() };
  });

  const run = (value: RegisterInput = input) => registerUser(value, { auth, users, session });

  it('creates the account, then the profile, then asks for verification and reads the session', async () => {
    await run({ ...input, idNumber: '1104567890' });

    expect(auth.calls).toEqual(['signUp:ana@runcty.dev:Runner2026', 'sendEmailVerification']);
    expect(users.created).toEqual([
      {
        firstName: 'Ana',
        lastName: 'Torres',
        birthDate: '1998-07-14',
        cityId: 'loja',
        idNumber: '1104567890',
      },
    ]);
    expect(session.refreshSession).toHaveBeenCalledOnce();
  });

  it('omits an empty id number', async () => {
    await run();

    expect(users.created[0]).not.toHaveProperty('idNumber');
  });

  it('deletes the Firebase account when the profile cannot be created (no orphans)', async () => {
    users.failure = new Error('api down');

    await expect(run()).rejects.toThrow('api down');

    expect(auth.calls).toContain('deleteCurrentUser');
    expect(auth.calls).not.toContain('sendEmailVerification');
    expect(session.refreshSession).not.toHaveBeenCalled();
  });

  it('reports the original error even if the rollback also fails', async () => {
    users.failure = new Error('api down');
    auth.failures.deleteCurrentUser = { code: 'auth/network-request-failed' };

    await expect(run()).rejects.toThrow('api down');
  });

  it('creates nothing else when the email is already in use', async () => {
    auth.failures.signUp = { code: 'auth/email-already-in-use' };

    await expect(run()).rejects.toEqual({ code: 'auth/email-already-in-use' });

    expect(users.created).toEqual([]);
    expect(auth.calls).not.toContain('deleteCurrentUser');
  });

  it('does not fail the sign-up when the verification email cannot be sent', async () => {
    auth.failures.sendEmailVerification = { code: 'auth/too-many-requests' };

    await expect(run()).resolves.toBeUndefined();
    expect(session.refreshSession).toHaveBeenCalledOnce();
  });
});

describe('requestPasswordReset', () => {
  let auth: FakeFirebaseAuthGateway;

  beforeEach(() => (auth = new FakeFirebaseAuthGateway()));

  it('sends the reset email to the normalized address', async () => {
    await requestPasswordReset(' Ana@Runcty.dev', { auth });

    expect(auth.calls).toEqual(['sendPasswordReset:ana@runcty.dev']);
  });

  it('does not reveal whether the account exists', async () => {
    auth.failures.sendPasswordReset = { code: 'auth/user-not-found' };

    await expect(requestPasswordReset('ghost@runcty.dev', { auth })).resolves.toBeUndefined();
  });

  it('still surfaces network problems', async () => {
    auth.failures.sendPasswordReset = { code: 'auth/network-request-failed' };

    await expect(requestPasswordReset('ana@runcty.dev', { auth })).rejects.toEqual({
      code: 'auth/network-request-failed',
    });
  });
});
