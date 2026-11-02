/**
 * RF-04-4: a city or zone can only be deleted when no route references it
 * and, for cities, when it has no zones left.
 * Pure apart from the injected dependencies so it is unit-testable.
 */
import { DomainError, invalidArgument } from '../shared/errors';

/** Slug ids, like the admin panel generates them (e.g. `loja`, `loja-centro`). */
export const CITY_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;

export interface DeleteCityDeps {
  cityExists(id: string): Promise<boolean>;
  /** Any `routes` doc with `cityId == id`. */
  hasRoutes(id: string): Promise<boolean>;
  /** Any `cities` doc with `parentCityId == id`. */
  hasZones(id: string): Promise<boolean>;
  deleteCity(id: string): Promise<void>;
}

export async function deleteCity(raw: unknown, deps: DeleteCityDeps): Promise<void> {
  const id = (raw as { id?: unknown } | null)?.id;
  if (typeof id !== 'string' || !CITY_ID_PATTERN.test(id)) {
    throw invalidArgument('invalid-city-id', 'A valid city id is required.');
  }
  if (!(await deps.cityExists(id))) {
    throw new DomainError('not-found', 'city-not-found', `City "${id}" does not exist.`);
  }
  if (await deps.hasRoutes(id)) {
    throw new DomainError('failed-precondition', 'city-has-routes', 'The city has associated routes.');
  }
  if (await deps.hasZones(id)) {
    throw new DomainError('failed-precondition', 'city-has-zones', 'The city still has zones.');
  }
  await deps.deleteCity(id);
}
