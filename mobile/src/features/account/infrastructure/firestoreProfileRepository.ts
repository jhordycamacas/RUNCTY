import { deleteField, doc, getDoc, serverTimestamp, updateDoc, type Firestore } from 'firebase/firestore';

import { collections } from '@/core/firebase';

import type { ProfileRepository, Usuario } from '../domain';

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

export function createFirestoreProfileRepository(db: Firestore): ProfileRepository {
  return {
    async get(uid) {
      const snapshot = await getDoc(doc(db, collections.users, uid));
      if (!snapshot.exists()) return null;
      const data = snapshot.data();
      const profile: Usuario = {
        uid,
        email: asString(data.email),
        firstName: asString(data.firstName),
        lastName: asString(data.lastName),
        birthDate: asString(data.birthDate),
        cityId: asString(data.cityId),
        idNumber: asString(data.idNumber) || undefined,
        role: asString(data.role) || undefined,
      };
      return profile;
    },
    async updatePersonalData(uid, data) {
      // Only fields allowed by firestore.rules (email and role are immutable).
      await updateDoc(doc(db, collections.users, uid), {
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate,
        cityId: data.cityId,
        idNumber: data.idNumber ? data.idNumber : deleteField(),
        updatedAt: serverTimestamp(),
      });
    },
  };
}
