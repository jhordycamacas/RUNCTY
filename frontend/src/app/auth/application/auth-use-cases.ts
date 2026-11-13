import { FirebaseAuthGateway } from '../../core/auth/firebase-auth.gateway';
import { NewUserProfile, UsersRepository } from '../domain/ports';
import { normalizeEmail, trimPersonalData } from '../domain/personal-data';
import { RegisterInput } from '../domain/registration';

/** What the use cases need from the signed-in session (`AuthService` implements it). */
export interface SessionPort {
  refreshSession(): Promise<void>;
}

/**
 * RF-01-1: creates the Firebase account, then the profile through the API (which assigns the
 * `runner` role), then asks for email verification without blocking and reads the new session.
 * If the profile cannot be created the Firebase account is deleted so no orphan credentials
 * remain.
 */
export async function registerUser(
  input: RegisterInput,
  deps: { auth: FirebaseAuthGateway; users: UsersRepository; session: SessionPort },
): Promise<void> {
  await deps.auth.signUp(normalizeEmail(input.email), input.password);

  const { idNumber, ...personalData } = trimPersonalData(input);
  const profile: NewUserProfile = { ...personalData, ...(idNumber ? { idNumber } : {}) };

  try {
    await deps.users.create(profile);
  } catch (error) {
    // Best effort: the original error is what the user needs to see.
    await deps.auth.deleteCurrentUser().catch(() => undefined);
    throw error;
  }

  // Non-blocking: the account works even if the email cannot be sent now.
  void deps.auth.sendEmailVerification().catch(() => undefined);
  await deps.session.refreshSession();
}

/** RF-01-7: never reveals whether an account exists for the email. */
export async function requestPasswordReset(
  email: string,
  deps: { auth: FirebaseAuthGateway },
): Promise<void> {
  try {
    await deps.auth.sendPasswordReset(normalizeEmail(email));
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'auth/user-not-found'
    ) {
      return;
    }
    throw error;
  }
}
