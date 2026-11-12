import { doc, onSnapshot, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';

import { collections } from '@/core/firebase';

import type { UserDocGateway } from '../domain';

export function createFirestoreUserDocGateway(db: Firestore): UserDocGateway {
  return {
    async createUserDoc(profile) {
      // Shape enforced by firestore.rules (isValidNewUser).
      await setDoc(doc(db, collections.users, profile.uid), {
        ...profile,
        consent: { lopdp: true, acceptedAt: serverTimestamp() },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    watchRole(uid, listener) {
      return onSnapshot(
        doc(db, collections.users, uid),
        (snapshot) => {
          const role: unknown = snapshot.get('role');
          listener(typeof role === 'string' ? role : null);
        },
        // Permission errors after sign-out are expected; the session handles it.
        () => listener(null),
      );
    },
  };
}
