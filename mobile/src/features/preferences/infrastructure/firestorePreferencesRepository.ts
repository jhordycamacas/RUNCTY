import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';

import { collections, userPrivateDocs } from '@/core/firebase';

import { parsePreferences, type PreferencesRepository } from '../domain';

export function createFirestorePreferencesRepository(db: Firestore): PreferencesRepository {
  const ref = (uid: string) => doc(db, collections.users, uid, 'private', userPrivateDocs.preferences);

  return {
    async get(uid) {
      const snapshot = await getDoc(ref(uid));
      // Missing doc → null (the app uses the defaults without writing).
      return snapshot.exists() ? parsePreferences(snapshot.data()) : null;
    },
    async save(uid, preferences) {
      // Full replace: the rules accept exactly these fields.
      await setDoc(ref(uid), { ...preferences, updatedAt: serverTimestamp() });
    },
    async remove(uid) {
      await deleteDoc(ref(uid));
    },
  };
}
