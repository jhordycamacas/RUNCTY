import { FirebaseAuthGateway } from '../../core/auth/firebase-auth.gateway';
import { AccountRepository, ChangePasswordInput, DeleteAccountInput } from '../domain/profile';

/** RF-01-3: the current password is verified before setting a new one. */
export async function changePassword(
  input: ChangePasswordInput,
  deps: { auth: FirebaseAuthGateway },
): Promise<void> {
  await deps.auth.reauthenticate(input.currentPassword);
  await deps.auth.updatePassword(input.newPassword);
}

/**
 * RF-01-4: re-authentication proves consent. The ID token is then refreshed, because the server
 * only deletes the account when the token says the sign-in is recent (`recent-sign-in-required`).
 */
export async function deleteAccount(
  input: DeleteAccountInput,
  deps: {
    auth: FirebaseAuthGateway;
    account: AccountRepository;
    /** Clears the local session (`AuthService.signOut`). */
    signOut: () => Promise<void>;
  },
): Promise<void> {
  await deps.auth.reauthenticate(input.password);
  await deps.auth.getIdToken(true);
  await deps.account.delete();
  // The account no longer exists; a failed local sign-out is harmless.
  await deps.signOut().catch(() => undefined);
}
