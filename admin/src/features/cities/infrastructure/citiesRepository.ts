'use client';

import { collection, getDocs } from 'firebase/firestore';

import { COLLECTIONS, firestore } from '@/core/firebase/client';

export interface CityOption {
  id: string;
  label: string;
}

/** Public catalog: every city and zone, for filters and pickers. */
export async function listCityOptions(): Promise<CityOption[]> {
  const snapshot = await getDocs(collection(firestore(), COLLECTIONS.cities));
  return snapshot.docs
    .map((d) => ({ id: d.id, label: typeof d.get('name') === 'string' ? (d.get('name') as string) : d.id }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}
