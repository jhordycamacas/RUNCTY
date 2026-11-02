import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { COLLECTIONS, auth, db } from '../config';
import { deleteUserAccount, isRecentSignIn } from './deleteAccount';

/**
 * Callable `deleteAccount`: deletes the caller's account. Requires a recent
 * sign-in (the app re-authenticates with the current password first).
 */
export const deleteAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in to delete your account.');
  }
  if (!isRecentSignIn(request.auth.token.auth_time, Date.now())) {
    throw new HttpsError('failed-precondition', 'Re-authenticate before deleting your account.');
  }

  const { uid } = request.auth;
  await deleteUserAccount(uid, {
    deleteUserData: (id) => db().recursiveDelete(db().collection(COLLECTIONS.users).doc(id)),
    deleteAuthUser: (id) => auth().deleteUser(id),
  });

  logger.info('Account deleted', { uid });
  return { deleted: true };
});
