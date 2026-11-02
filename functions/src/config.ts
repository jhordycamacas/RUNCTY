/**
 * Firebase Admin initialization.
 *
 * The project id is resolved by the runtime (GCLOUD_PROJECT in Cloud Functions
 * and in the emulator), so nothing is hardcoded here.
 */
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp();
}

// Lazy getters: the Firebase CLI loads this module during deploy analysis
// without credentials, so clients are only created inside handlers.
export const db = () => getFirestore();
export const auth = () => getAuth();

export const COLLECTIONS = {
  users: 'users',
  cities: 'cities',
  roles: 'roles',
} as const;

export const USER_PRIVATE_DOCS = {
  sportProfile: 'sportProfile',
  preferences: 'preferences',
} as const;
