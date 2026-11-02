/**
 * Single Firebase initialization for the app (JS SDK only).
 * Import `auth`, `db` and `functions` from here; never call initializeApp elsewhere.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

import { EMULATOR_PORTS, FUNCTIONS_REGION, emulatorHost, firebaseOptions, useEmulators } from './config';

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseOptions) : getApp();

// initializeAuth may only run once per app; Fast Refresh re-evaluates modules.
const auth: Auth = isFirstInit
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

const db = getFirestore(app);
const functions = getFunctions(app, FUNCTIONS_REGION);

if (useEmulators && isFirstInit) {
  connectAuthEmulator(auth, `http://${emulatorHost}:${EMULATOR_PORTS.auth}`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, EMULATOR_PORTS.firestore);
  connectFunctionsEmulator(functions, emulatorHost, EMULATOR_PORTS.functions);
}

export { app, auth, db, functions };

export const collections = {
  users: 'users',
  cities: 'cities',
  roles: 'roles',
  routes: 'routes',
} as const;

/** Sub-documents under `users/{uid}/private/{doc}`. */
export const userPrivateDocs = {
  sportProfile: 'sportProfile',
  preferences: 'preferences',
} as const;
