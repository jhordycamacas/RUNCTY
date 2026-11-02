import { logger } from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';

import { COLLECTIONS, db } from '../config';
import { requirePermission, runDomain } from '../shared/callable';
import { deleteCity as deleteCityLogic } from './deleteCity';

/** Callable `deleteCity` (RF-04-4). Requires the `cities.manage` permission. */
export const deleteCity = onCall(async (request) => {
  const caller = requirePermission(request, 'cities.manage');
  const cities = () => db().collection(COLLECTIONS.cities);

  await runDomain(() =>
    deleteCityLogic(request.data, {
      cityExists: async (id) => (await cities().doc(id).get()).exists,
      hasRoutes: async (id) =>
        !(await db().collection(COLLECTIONS.routes).where('cityId', '==', id).limit(1).select().get()).empty,
      hasZones: async (id) => !(await cities().where('parentCityId', '==', id).limit(1).select().get()).empty,
      deleteCity: async (id) => {
        await cities().doc(id).delete();
      },
    }),
  );

  logger.info('City deleted', { caller, cityId: (request.data as { id?: unknown })?.id });
  return { ok: true };
});
