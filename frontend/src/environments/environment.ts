import type { Environment } from './environment.model';

/**
 * Development: the API and the Firebase Auth emulator run on the machine that serves the app.
 * `location.hostname` is `localhost` in the browser and the computer's LAN address when a phone
 * opens the live-reload server (`ionic cap run android -l --external`).
 * The emulators accept any API key.
 */
const host = location.hostname;

export const environment: Environment = {
  apiBaseUrl: `http://${host}:8000/api/v1`,
  firebase: {
    apiKey: 'demo-key',
    authDomain: 'demo-runcty.firebaseapp.com',
    projectId: 'demo-runcty',
  },
  authEmulatorUrl: `http://${host}:9099`,
  googleMapsApiKey: null,
};
