import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase client configuration from NEXT_PUBLIC_* variables. Next.js inlines
 * them at build time, so `env` below reads each one with a static expression.
 *
 * Defaults target the local emulators (project `demo-runcty`), which accept
 * any API key. Real values go in `admin/.env.local` (gitignored).
 * The admin panel never uses a service account: privileged operations go
 * through Cloud Functions callables that check the caller's permissions.
 */
export interface RawFirebaseEnv {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  useEmulators?: string;
  emulatorHost?: string;
}

export interface FirebaseClientConfig {
  options: FirebaseOptions;
  useEmulators: boolean;
  emulatorHost: string;
}

export const FUNCTIONS_REGION = 'us-central1';
export const EMULATOR_PORTS = { auth: 9099, firestore: 8080, functions: 5001 } as const;

export function readFirebaseConfig(env: RawFirebaseEnv): FirebaseClientConfig {
  const projectId = env.projectId || 'demo-runcty';
  return {
    options: {
      apiKey: env.apiKey || 'demo-key',
      authDomain: env.authDomain || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: env.storageBucket || `${projectId}.appspot.com`,
      messagingSenderId: env.messagingSenderId || undefined,
      appId: env.appId || undefined,
    },
    useEmulators: env.useEmulators === 'true',
    emulatorHost: env.emulatorHost || '127.0.0.1',
  };
}

export const env: RawFirebaseEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  useEmulators: process.env.NEXT_PUBLIC_USE_EMULATORS,
  emulatorHost: process.env.NEXT_PUBLIC_EMULATOR_HOST,
};
