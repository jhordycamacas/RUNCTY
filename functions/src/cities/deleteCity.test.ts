import { describe, expect, it, vi } from 'vitest';

import { DomainError } from '../shared/errors';
import { deleteCity, type DeleteCityDeps } from './deleteCity';

function fakeDeps(overrides: Partial<DeleteCityDeps> = {}): DeleteCityDeps {
  return {
    cityExists: vi.fn(async () => true),
    hasRoutes: vi.fn(async () => false),
    hasZones: vi.fn(async () => false),
    deleteCity: vi.fn(async () => undefined),
    ...overrides,
  };
}

async function expectReason(promise: Promise<unknown>, reason: string): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(DomainError);
  await expect(promise).rejects.toMatchObject({ reason });
}

describe('deleteCity', () => {
  it('deletes a city without routes or zones', async () => {
    const deps = fakeDeps();
    await deleteCity({ id: 'quito' }, deps);
    expect(deps.hasRoutes).toHaveBeenCalledWith('quito');
    expect(deps.hasZones).toHaveBeenCalledWith('quito');
    expect(deps.deleteCity).toHaveBeenCalledWith('quito');
  });

  it('rejects a city with associated routes (RF-04-4)', async () => {
    const deps = fakeDeps({ hasRoutes: vi.fn(async () => true) });
    await expectReason(deleteCity({ id: 'loja' }, deps), 'city-has-routes');
    expect(deps.deleteCity).not.toHaveBeenCalled();
  });

  it('rejects a city that still has zones', async () => {
    const deps = fakeDeps({ hasZones: vi.fn(async () => true) });
    await expectReason(deleteCity({ id: 'loja' }, deps), 'city-has-zones');
    expect(deps.deleteCity).not.toHaveBeenCalled();
  });

  it('reports a missing city', async () => {
    await expectReason(deleteCity({ id: 'ghost' }, fakeDeps({ cityExists: vi.fn(async () => false) })), 'city-not-found');
  });

  it('rejects malformed ids', async () => {
    for (const id of ['', 'Loja', 'a/b', 42, undefined, 'x'.repeat(65)]) {
      await expectReason(deleteCity({ id }, fakeDeps()), 'invalid-city-id');
    }
  });
});
