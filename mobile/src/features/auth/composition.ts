/**
 * Composition root of the auth feature: binds the ports to Firebase.
 * Presentation code gets its dependencies from here, never from `firebase/*`.
 */
import { auth, db } from '@/core/firebase';

import { createFirebaseAuthGateway } from './infrastructure/firebaseAuthGateway';
import { createFirestoreUserDocGateway } from './infrastructure/firestoreUserDocGateway';

export const authGateway = createFirebaseAuthGateway(auth);
export const userDocGateway = createFirestoreUserDocGateway(db);
