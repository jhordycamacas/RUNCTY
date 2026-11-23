import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CatalogRepository } from '../../core/catalogs/catalog';
import {
  FakeCatalogRepository,
  fakeCatalogRepository,
} from '../../core/catalogs/testing/fake-catalog.repository';
import { ApiError } from '../../core/errors/api-error';
import { DEFAULT_SETTINGS } from '../../core/settings/system-settings';
import { SystemSettingsStore } from '../../core/settings/system-settings.store';
import { SportOptionsStore } from './sport-options.store';

describe('SportOptionsStore', () => {
  let repository: FakeCatalogRepository;
  let settings: { settings: ReturnType<typeof signal>; load: ReturnType<typeof vi.fn> };
  let store: SportOptionsStore;

  beforeEach(() => {
    repository = fakeCatalogRepository({
      sportLevels: [
        { code: 'beginner', label: 'Inicial', order: 1, active: true },
        { code: 'legacy', label: 'Antiguo', order: 2, active: false },
      ],
    });
    settings = {
      settings: signal({ ...DEFAULT_SETTINGS, paceMinSecPerKm: 180 }),
      load: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: CatalogRepository, useValue: repository },
        { provide: SystemSettingsStore, useValue: settings },
      ],
    });
    store = TestBed.inject(SportOptionsStore);
  });

  it('is not ready until both catalogs arrive', () => {
    expect(store.ready()).toBe(false);
    expect(store.levels()).toEqual([]);
  });

  it('offers only the active options, with the catalog labels', async () => {
    await store.load();

    expect(store.ready()).toBe(true);
    expect(store.levels().map((item) => item.code)).toEqual(['beginner']);
    expect(store.goals()).toHaveLength(5);
    expect(settings.load).toHaveBeenCalledOnce();
  });

  it('still labels a stored code that is no longer active, and shows an unknown code as it is', async () => {
    await store.load();

    expect(store.levelLabel('beginner')).toBe('Inicial');
    expect(store.levelLabel('legacy')).toBe('Antiguo');
    expect(store.levelLabel('gone')).toBe('gone');
    expect(store.goalLabel('weightLoss')).toBe('Bajar de peso');
  });

  it('builds the rules from the active codes and the configured ranges', async () => {
    await store.load();

    const rules = store.rules();
    expect(rules.levels).toEqual(['beginner']);
    expect(rules.paceMinSecPerKm).toBe(180);
    expect(rules.distanceMaxKm).toBe(50);
  });

  it('shows the translated error and recovers on retry', async () => {
    repository.list.mockRejectedValueOnce(new ApiError(0, 'network', 'No hay conexión.'));

    await store.load();
    expect(store.ready()).toBe(false);
    expect(store.error()).toBe('No hay conexión.');
    expect(store.levelLabel('beginner')).toBe('beginner');

    await store.load();
    expect(store.error()).toBeNull();
    expect(store.ready()).toBe(true);
  });
});
