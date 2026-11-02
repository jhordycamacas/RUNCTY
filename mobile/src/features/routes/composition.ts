import { db } from '@/core/firebase';

import { createFirestoreRouteRepository } from './infrastructure/firestoreRouteRepository';

export const routeRepository = createFirestoreRouteRepository(db);
