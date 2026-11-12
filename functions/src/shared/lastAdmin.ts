import { COLLECTIONS, db } from '../config';
import { ADMIN_ROLE } from '../roles/permissions';

/**
 * SEC-08: true when `uid` is the only user whose `users/{uid}.role` is admin.
 * Single-field query, so no composite index is needed.
 */
export async function isLastAdmin(uid: string): Promise<boolean> {
  const snap = await db().collection(COLLECTIONS.users).where('role', '==', ADMIN_ROLE).limit(2).select().get();
  return snap.size === 1 && snap.docs[0]?.id === uid;
}
