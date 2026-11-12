import { db } from '@/core/firebase';

import { createFirestoreSportProfileRepository } from './infrastructure/firestoreSportProfileRepository';

export const sportProfileRepository = createFirestoreSportProfileRepository(db);
