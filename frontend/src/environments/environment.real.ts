import type { Environment } from './environment.model';

/**
 * Local testing against the real Firebase project: the web app and the local API
 * (`python manage.py runserver 8000`) talk to Google's services, not to the emulators.
 * The web config is public by design, same as in `environment.prod.ts`.
 */
export const environment: Environment = {
  apiBaseUrl: `http://${location.hostname}:8000/api/v1`,
  firebase: {
    apiKey: 'AIzaSyAxptpSUjtxVlmKOqo7sST9tMXDOV0T9EQ',
    authDomain: 'runcty-73d70.firebaseapp.com',
    projectId: 'runcty-73d70',
    appId: '1:979173368114:web:d8d899ea670db82217b72b',
  },
  authEmulatorUrl: null,
};
