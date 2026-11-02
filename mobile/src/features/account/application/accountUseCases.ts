import type { AuthGateway, PersonalData } from '@/features/auth/domain';

import type { AccountGateway, ChangePasswordInput, DeleteAccountInput, ProfileRepository } from '../domain';

/** RF-01-3: update personal data. Email is read-only. */
export function updatePersonalData(
  uid: string,
  data: PersonalData,
  deps: { profiles: ProfileRepository },
): Promise<void> {
  return deps.profiles.updatePersonalData(uid, data);
}

/** RF-01-3: the current password is verified before setting a new one. */
export async function changePassword(input: ChangePasswordInput, deps: { auth: AuthGateway }): Promise<void> {
  await deps.auth.reauthenticate(input.currentPassword);
  await deps.auth.updatePassword(input.newPassword);
}

/**
 * RF-01-4: re-authentication proves consent and makes the token fresh enough
 * for the server, which deletes the data and the credentials.
 */
export async function deleteAccount(
  input: DeleteAccountInput,
  deps: { auth: AuthGateway; account: AccountGateway },
): Promise<void> {
  await deps.auth.reauthenticate(input.password);
  await deps.account.deleteAccount();
  // The account no longer exists; a failed local sign-out is harmless.
  await deps.auth.signOut().catch(() => undefined);
}
