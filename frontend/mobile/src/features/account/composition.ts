import { db, functions } from '@/core/firebase';
import { authGateway } from '@/features/auth';

import { createCallableAccountGateway } from './infrastructure/callableAccountGateway';
import { createFirestoreProfileRepository } from './infrastructure/firestoreProfileRepository';

export const profileRepository = createFirestoreProfileRepository(db);
export const accountGateway = createCallableAccountGateway(functions);
export { authGateway };
