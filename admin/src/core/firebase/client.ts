'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from 'firebase/functions';

import { EMULATOR_PORTS, FUNCTIONS_REGION, env, readFirebaseConfig } from './config';

/**
 * Lazy Firebase JS SDK clients. They are created on first use in the browser
 * (never during server prerendering) and connected to the emulators when
 * NEXT_PUBLIC_USE_EMULATORS=true.
 */
const config = readFirebaseConfig(env);

let auth: Auth | undefined;
let db: Firestore | undefined;
let functions: Functions | undefined;

function app(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(config.options);
}

export function firebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(app());
    if (config.useEmulators) {
      connectAuthEmulator(auth, `http://${config.emulatorHost}:${EMULATOR_PORTS.auth}`, { disableWarnings: true });
    }
  }
  return auth;
}

export function firestore(): Firestore {
  if (!db) {
    db = getFirestore(app());
    if (config.useEmulators) connectFirestoreEmulator(db, config.emulatorHost, EMULATOR_PORTS.firestore);
  }
  return db;
}

function cloudFunctions(): Functions {
  if (!functions) {
    functions = getFunctions(app(), FUNCTIONS_REGION);
    if (config.useEmulators) connectFunctionsEmulator(functions, config.emulatorHost, EMULATOR_PORTS.functions);
  }
  return functions;
}

/** Typed callable invocation. */
export async function callFunction<Req, Res>(name: string, data: Req): Promise<Res> {
  const result = await httpsCallable<Req, Res>(cloudFunctions(), name)(data);
  return result.data;
}

export const COLLECTIONS = {
  users: 'users',
  roles: 'roles',
  cities: 'cities',
  routes: 'routes',
} as const;

/** Subcollections of `routes/{id}` (risk factors hang from each segment). */
export const ROUTE_SUBCOLLECTIONS = {
  segments: 'segments',
  timeSlots: 'timeSlots',
  riskFactors: 'riskFactors',
} as const;
