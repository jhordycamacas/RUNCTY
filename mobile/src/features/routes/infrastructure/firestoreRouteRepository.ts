import { collection, doc, getDoc, getDocs, orderBy, query, where, type Firestore } from 'firebase/firestore';

import { collections } from '@/core/firebase';

import { toRoute, toSegment } from '../domain/mappers';
import type { RouteRepository } from '../domain/route';

export function createFirestoreRouteRepository(db: Firestore): RouteRepository {
  return {
    async listActiveByCity(cityId) {
      // `active == true` is required: the rules only let runners read active routes.
      const snapshot = await getDocs(
        query(collection(db, collections.routes), where('cityId', '==', cityId), where('active', '==', true)),
      );
      return snapshot.docs.map((d) => toRoute(d.id, d.data()));
    },

    async getById(routeId) {
      const snapshot = await getDoc(doc(db, collections.routes, routeId));
      return snapshot.exists() ? toRoute(snapshot.id, snapshot.data()) : null;
    },

    async listSegments(routeId) {
      const snapshot = await getDocs(
        query(collection(db, collections.routes, routeId, 'segments'), orderBy('order')),
      );
      return snapshot.docs.map((d) => toSegment(d.id, d.data()));
    },
  };
}
