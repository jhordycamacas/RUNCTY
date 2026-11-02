import type { AuthGateway, AuthUser, UserDocGateway } from '../../domain';

/** In-memory fakes of the auth ports for use-case tests. */
export function fakeAuthGateway(overrides: Partial<AuthGateway> = {}): jest.Mocked<AuthGateway> {
  const user: AuthUser = { uid: 'uid-1', email: 'ana@runcty.dev', emailVerified: false };
  return {
    signUp: jest.fn(async () => user),
    signIn: jest.fn(async () => user),
    signOut: jest.fn(async () => undefined),
    sendEmailVerification: jest.fn(async () => undefined),
    sendPasswordReset: jest.fn(async () => undefined),
    deleteCurrentUser: jest.fn(async () => undefined),
    reauthenticate: jest.fn(async () => undefined),
    updatePassword: jest.fn(async () => undefined),
    onAuthStateChanged: jest.fn(() => () => undefined),
    getRole: jest.fn(async () => null),
    ...overrides,
  } as jest.Mocked<AuthGateway>;
}

export function fakeUserDocGateway(overrides: Partial<UserDocGateway> = {}): jest.Mocked<UserDocGateway> {
  return {
    createUserDoc: jest.fn(async () => undefined),
    watchRole: jest.fn(() => () => undefined),
    ...overrides,
  } as jest.Mocked<UserDocGateway>;
}

export const authError = (code: string) => Object.assign(new Error(code), { code });
