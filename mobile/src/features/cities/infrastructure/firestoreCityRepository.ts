import { collection, getDocs, query, where, type Firestore } from 'firebase/firestore';

import { collections } from '@/core/firebase';

import type { City, CityRepository } from '../domain/city';

export function createFirestoreCityRepository(db: Firestore): CityRepository {
  return {
    async listActive() {
      const snapshot = await getDocs(query(collection(db, collections.cities), where('coverage', '==', 'active')));
      // Sorted in memory: few cities, and it avoids a composite index.
      return snapshot.docs
        .map((d): City => ({ id: d.id, name: String(d.get('name') ?? d.id), province: d.get('province') }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    },
  };
}
