import type { Environment } from './environment.model';

/**
 * Production placeholders. Replace them at deployment time; real values never enter git
 * (the web API key is public by design, but it still belongs to the deployment, not the repo).
 */
export const environment: Environment = {
  apiBaseUrl: 'https://api.example.com/api/v1',
  firebase: {
    apiKey: 'AIzaSyAxptpSUjtxVlmKOqo7sST9tMXDOV0T9EQ',
    authDomain: 'runcty-73d70.firebaseapp.com',
    projectId: 'runcty-73d70',
    appId: '1:979173368114:web:d8d899ea670db82217b72b',
  },
  authEmulatorUrl: null,
};
