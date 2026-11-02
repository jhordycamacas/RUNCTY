import { FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { COLLECTIONS, auth, db } from '../config';
import { assignDefaultRole } from './assignDefaultRole';

const NOT_FOUND = 5;

/**
 * Assigns the default `runner` role when a user doc is created by the client.
 * Clients cannot write `role` (see firestore.rules); only this trigger does.
 */
export const onUserDocCreated = onDocumentCreated(`${COLLECTIONS.users}/{uid}`, async (event) => {
  const { uid } = event.params;
  const docRole: unknown = event.data?.get('role');

  const role = await assignDefaultRole(uid, docRole, {
    getCustomClaims: async (id) => (await auth().getUser(id)).customClaims,
    setCustomClaims: (id, claims) => auth().setCustomUserClaims(id, claims),
    setDocRole: async (id, value) => {
      try {
        // update (not set) so an account deleted in the meantime is not recreated.
        await db()
          .collection(COLLECTIONS.users)
          .doc(id)
          .update({ role: value, updatedAt: FieldValue.serverTimestamp() });
      } catch (error) {
        if ((error as { code?: number }).code === NOT_FOUND) return;
        throw error;
      }
    },
  });

  logger.info('Role assigned', { uid, role });
});
