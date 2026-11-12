'use client';

import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, type DocumentData } from 'firebase/firestore';

import { COLLECTIONS, callFunction, firestore } from '@/core/firebase/client';

import { COVERAGES, type Ciudad, type CityCoverage, type CityData } from '../domain/city';

export interface CityOption {
  id: string;
  label: string;
}

const num = (value: unknown): number => (typeof value === 'number' ? value : 0);

/** Tolerant read: docs created before zones existed have no `type`. */
function toCity(id: string, data: DocumentData): Ciudad {
  const location = (data.location ?? {}) as Record<string, unknown>;
  const coverage = COVERAGES.includes(data.coverage) ? (data.coverage as CityCoverage) : 'planned';
  return {
    id,
    name: typeof data.name === 'string' ? data.name : id,
    province: typeof data.province === 'string' ? data.province : '',
    country: 'EC',
    type: data.type === 'zone' ? 'zone' : 'city',
    parentCityId: typeof data.parentCityId === 'string' ? data.parentCityId : undefined,
    location: { lat: num(location.lat), lng: num(location.lng) },
    coverage,
  };
}

/** Public catalog: every city and zone, sorted by name. */
export async function listCities(): Promise<Ciudad[]> {
  const snapshot = await getDocs(collection(firestore(), COLLECTIONS.cities));
  return snapshot.docs.map((d) => toCity(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export class CityExistsError extends Error {
  constructor() {
    super('Ya existe una ciudad o zona con ese identificador.');
    this.name = 'CityExistsError';
  }
}

/** Shape and permission (`cities.manage`) are enforced by firestore.rules. */
export async function createCity(id: string, city: CityData): Promise<void> {
  const ref = doc(firestore(), COLLECTIONS.cities, id);
  if ((await getDoc(ref)).exists()) throw new CityExistsError();
  await setDoc(ref, { ...city, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

/** `type` and `createdAt` are immutable; the rules reject other changes to them. */
export async function updateCity(id: string, city: CityData): Promise<void> {
  const editable: Partial<CityData> = { ...city };
  delete editable.type;
  await updateDoc(doc(firestore(), COLLECTIONS.cities, id), { ...editable, updatedAt: serverTimestamp() });
}

/** RF-04-4: the callable rejects cities with routes or zones. */
export const deleteCity = (id: string) => callFunction<{ id: string }, { ok: true }>('deleteCity', { id });

export async function listCityOptions(): Promise<CityOption[]> {
  const cities = await listCities();
  return cities.map((c) => ({ id: c.id, label: c.type === 'zone' ? `${c.name} (zona)` : c.name }));
}
