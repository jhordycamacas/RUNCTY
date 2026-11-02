import { httpsCallable, type Functions } from 'firebase/functions';

import type { AccountGateway } from '../domain';

/** Calls the `deleteAccount` Cloud Function (functions/src/users/deleteAccountCallable.ts). */
export function createCallableAccountGateway(functions: Functions): AccountGateway {
  const callDeleteAccount = httpsCallable<void, { deleted: boolean }>(functions, 'deleteAccount');
  return {
    async deleteAccount() {
      await callDeleteAccount();
    },
  };
}
