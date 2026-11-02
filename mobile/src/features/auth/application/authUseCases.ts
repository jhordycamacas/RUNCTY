import {
  errorCode,
  type AuthGateway,
  type AuthUser,
  type ForgotPasswordInput,
  type LoginInput,
  type NewUserProfile,
  type RegisterInput,
  type UserDocGateway,
} from '../domain';

/**
 * RF-01-1: creates the auth account, then `users/{uid}` (without role; a Cloud
 * Function assigns it), then requests email verification without blocking.
 * If the doc cannot be created the auth account is deleted so no orphan
 * credentials remain.
 */
export async function registerUser(
  input: RegisterInput,
  deps: { auth: AuthGateway; users: UserDocGateway },
): Promise<AuthUser> {
  const user = await deps.auth.signUp(input.email, input.password);

  const profile: NewUserProfile = {
    uid: user.uid,
    email: user.email,
    firstName: input.firstName,
    lastName: input.lastName,
    birthDate: input.birthDate,
    cityId: input.cityId,
    ...(input.idNumber ? { idNumber: input.idNumber } : {}),
  };

  try {
    await deps.users.createUserDoc(profile);
  } catch (error) {
    // Best effort: the original error is what the user needs to see.
    await deps.auth.deleteCurrentUser().catch(() => undefined);
    throw error;
  }

  // Non-blocking: the account works even if the email cannot be sent now.
  void deps.auth.sendEmailVerification().catch(() => undefined);
  return user;
}

/** RF-01-6 */
export function signIn(input: LoginInput, deps: { auth: AuthGateway }): Promise<AuthUser> {
  return deps.auth.signIn(input.email, input.password);
}

/** RF-01-7: never reveals whether an account exists for the email. */
export async function requestPasswordReset(
  input: ForgotPasswordInput,
  deps: { auth: AuthGateway },
): Promise<void> {
  try {
    await deps.auth.sendPasswordReset(input.email);
  } catch (error) {
    if (errorCode(error) === 'auth/user-not-found') return;
    throw error;
  }
}
