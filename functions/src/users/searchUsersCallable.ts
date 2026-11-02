import { FieldPath, type Query } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';

import { COLLECTIONS, db } from '../config';
import { requirePermission, runDomain } from '../shared/callable';
import { parseSearchUsersInput, searchUsers as searchUsersLogic } from './searchUsers';

/** Callable `searchUsers` (RF-01-2). Requires the `users.read` permission. */
export const searchUsers = onCall(async (request) => {
  requirePermission(request, 'users.read');

  return runDomain(async () => {
    const query = parseSearchUsersInput(request.data);
    return searchUsersLogic(query, {
      async scan(filters, startAfter, batchSize) {
        let q: Query = db().collection(COLLECTIONS.users);
        for (const [field, value] of filters) q = q.where(field, '==', value);
        // Only the fields of UserSummary leave Firestore (data minimization).
        q = q
          .select('email', 'firstName', 'lastName', 'birthDate', 'cityId', 'role')
          .orderBy(FieldPath.documentId())
          .limit(batchSize);
        if (startAfter) q = q.startAfter(startAfter);
        const snap = await q.get();
        return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
      },
    });
  });
});
