import { db } from '@/core/firebase';

import { createAsyncStoragePreferencesCache } from './infrastructure/asyncStoragePreferencesCache';
import { createFirestorePreferencesRepository } from './infrastructure/firestorePreferencesRepository';

export const preferencesDeps = {
  repo: createFirestorePreferencesRepository(db),
  cache: createAsyncStoragePreferencesCache(),
};
