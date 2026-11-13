import type { FirebaseOptions } from 'firebase/app';

export interface Environment {
  /** Base URL of the Django REST API, without a trailing slash. */
  apiBaseUrl: string;
  firebase: FirebaseOptions;
  /** Auth emulator URL, or null to talk to the real Firebase Auth. */
  authEmulatorUrl: string | null;
}
