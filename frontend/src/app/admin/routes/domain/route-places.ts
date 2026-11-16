import { CityRecord } from '../../../cities/domain/city';

/** A city or zone a route can belong to, as the admin pickers show it. */
export interface RoutePlace {
  id: string;
  name: string;
}

/**
 * Routes belong to a city or to one of its zones, so the admin lists both (the runner pickers
 * only list cities). Zones are marked so they are not mistaken for a city of the same name.
 */
export function toRoutePlaces(records: CityRecord[]): RoutePlace[] {
  return records
    .map((record) => {
      const name = typeof record.name === 'string' && record.name ? record.name : record.id;
      return { id: record.id, name: record.type === 'zone' ? `${name} (zona)` : name };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
