import { db } from '@/core/firebase';

import { createFirestoreCityRepository } from './infrastructure/firestoreCityRepository';

export const cityRepository = createFirestoreCityRepository(db);
