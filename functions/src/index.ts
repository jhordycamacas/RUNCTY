import { setGlobalOptions } from 'firebase-functions/v2';

import './config';

setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

export * from './cities';
export * from './roles';
export * from './routes';
export * from './users';
