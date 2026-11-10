import { setGlobalOptions } from 'firebase-functions/v2';

import './config';
import { isAppCheckEnforced } from './shared/appCheck';

// App Check is opt-in (ENFORCE_APP_CHECK=true) so the emulators and the demo keep working.
setGlobalOptions({ region: 'us-central1', maxInstances: 10, enforceAppCheck: isAppCheckEnforced() });

export * from './cities';
export * from './roles';
export * from './routes';
export * from './users';
