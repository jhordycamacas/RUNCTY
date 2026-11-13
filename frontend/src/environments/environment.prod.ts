import type { Environment } from './environment.model';

/**
 * Production placeholders. Replace them at deployment time; real values never enter git
 * (the web API key is public by design, but it still belongs to the deployment, not the repo).
 */
export const environment: Environment = {
  apiBaseUrl: 'https://api.example.com/api/v1',
  firebase: {
    apiKey: 'REPLACE_WITH_WEB_API_KEY',
    authDomain: 'REPLACE_WITH_PROJECT_ID.firebaseapp.com',
    projectId: 'REPLACE_WITH_PROJECT_ID',
    appId: 'REPLACE_WITH_APP_ID',
  },
  authEmulatorUrl: null,
};
