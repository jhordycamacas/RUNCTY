import { collection, getDocs, query, where, type Firestore } from 'firebase/firestore';

import { collections } from '@/core/firebase';

import { toPickerCities, type CityRepository } from '../domain/city';

export function createFirestoreCityRepository(db: Firestore): CityRepository {
  return {
    async listActive() {
      const snapshot = await getDocs(query(collection(db, collections.cities), where('coverage', '==', 'active')));
      // Zones are filtered and sorted in memory: few docs, and it avoids a composite index.
      return toPickerCities(snapshot.docs.map((d) => ({ id: d.id, data: d.data() })));
    },
  };
}
