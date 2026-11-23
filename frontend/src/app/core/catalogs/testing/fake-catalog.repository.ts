import { vi } from 'vitest';
import { CatalogId, CatalogItem, CatalogRepository } from '../catalog';

export const SPORT_LEVEL_ITEMS: readonly CatalogItem[] = [
  { code: 'beginner', label: 'Principiante', order: 1, active: true },
  { code: 'intermediate', label: 'Intermedio', order: 2, active: true },
  { code: 'advanced', label: 'Avanzado', order: 3, active: true },
];

export const SPORT_GOAL_ITEMS: readonly CatalogItem[] = [
  { code: 'health', label: 'Salud', order: 1, active: true },
  { code: 'weightLoss', label: 'Bajar de peso', order: 2, active: true },
  { code: 'racePrep', label: 'Preparar una carrera', order: 3, active: true },
  { code: 'pace', label: 'Mejorar mi ritmo', order: 4, active: true },
  { code: 'social', label: 'Socializar', order: 5, active: true },
];

/** Both catalogs as mocks, answering the sport options unless a test says otherwise. */
export function fakeCatalogRepository(
  initial: Partial<Record<CatalogId, readonly CatalogItem[]>> = {},
) {
  const data: Record<CatalogId, CatalogItem[]> = {
    sportLevels: [...(initial.sportLevels ?? SPORT_LEVEL_ITEMS)],
    sportGoals: [...(initial.sportGoals ?? SPORT_GOAL_ITEMS)],
  };
  return {
    list: vi
      .fn<CatalogRepository['list']>()
      .mockImplementation(async (id) => data[id].map((item) => ({ ...item }))),
    save: vi.fn<CatalogRepository['save']>().mockImplementation(async (id, items) => {
      data[id] = items.map((item) => ({ ...item }));
      return data[id].map((item) => ({ ...item }));
    }),
  };
}

export type FakeCatalogRepository = ReturnType<typeof fakeCatalogRepository>;
