import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';

import { collections, userPrivateDocs } from '@/core/firebase';

import { sportProfileSchema, type SportProfileRepository } from '../domain/sportProfile';

export function createFirestoreSportProfileRepository(db: Firestore): SportProfileRepository {
  const ref = (uid: string) => doc(db, collections.users, uid, 'private', userPrivateDocs.sportProfile);

  return {
    async get(uid) {
      const snapshot = await getDoc(ref(uid));
      if (!snapshot.exists()) return null;
      const parsed = sportProfileSchema.safeParse(snapshot.data());
      // A doc that no longer matches the schema is treated as missing.
      return parsed.success ? parsed.data : null;
    },
    async save(uid, profile) {
      // Full replace: the rules accept exactly these fields.
      await setDoc(ref(uid), { ...profile, updatedAt: serverTimestamp() });
    },
    async remove(uid) {
      await deleteDoc(ref(uid));
    },
  };
}
