import type { FirebaseOptions } from 'firebase/app';

export interface Environment {
  /** Base URL of the Django REST API, without a trailing slash. */
  apiBaseUrl: string;
  firebase: FirebaseOptions;
  /** Auth emulator URL, or null to talk to the real Firebase Auth. */
  authEmulatorUrl: string | null;
  /**
   * Maps JavaScript API browser key, or null to draw the maps with OpenStreetMap (Leaflet). Public
   * by design but restricted by HTTP referrer and API in Google Cloud; never commit a real key.
   */
  googleMapsApiKey: string | null;
}
