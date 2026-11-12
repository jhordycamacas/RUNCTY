import type { FirebaseOptions } from 'firebase/app';
import { Platform } from 'react-native';

/**
 * Firebase configuration read from EXPO_PUBLIC_* variables.
 * Expo inlines these at build time, so they must be accessed with static
 * `process.env.EXPO_PUBLIC_X` expressions (no dynamic lookups).
 *
 * Defaults target the local emulators (project `demo-runcty`), which accept
 * any API key. Real values go in `mobile/.env` (gitignored).
 */
export const firebaseOptions: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-runcty.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'demo-runcty',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-runcty.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || undefined,
};

export const FUNCTIONS_REGION = 'us-central1';

export const useEmulators = process.env.EXPO_PUBLIC_USE_EMULATORS === 'true';

/**
 * Host where the emulators run. Physical devices need the computer's LAN IP;
 * the Android emulator reaches the host machine through 10.0.2.2.
 */
export const emulatorHost =
  process.env.EXPO_PUBLIC_EMULATOR_HOST || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');

export const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  functions: 5001,
} as const;
