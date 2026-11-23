import { TestBed } from '@angular/core/testing';
import { CatalogRepository } from '../../../../core/catalogs/catalog';
import {
  FakeCatalogRepository,
  SPORT_GOAL_ITEMS,
  SPORT_LEVEL_ITEMS,
  fakeCatalogRepository,
} from '../../../../core/catalogs/testing/fake-catalog.repository';
import { ApiError } from '../../../../core/errors/api-error';
import { CatalogsStore } from './catalogs.store';

describe('CatalogsStore', () => {
  let repository: FakeCatalogRepository;
  let store: CatalogsStore;

  beforeEach(() => {
    repository = fakeCatalogRepository();
    TestBed.configureTestingModule({
      providers: [CatalogsStore, { provide: CatalogRepository, useValue: repository }],
    });
    store = TestBed.inject(CatalogsStore);
  });

  it('has nothing until the catalogs arrive', () => {
    expect(store.items('sportLevels')).toBeNull();
    expect(store.error()).toBeNull();
  });

  it('loads both catalogs', async () => {
    await store.load();

    expect(store.items('sportLevels')).toEqual(SPORT_LEVEL_ITEMS);
    expect(store.items('sportGoals')).toEqual(SPORT_GOAL_ITEMS);
  });

  it('shows the translated error and recovers on retry', async () => {
    repository.list.mockRejectedValueOnce(new ApiError(0, 'network', 'No hay conexión.'));

    await store.load();
    expect(store.error()).toBe('No hay conexión.');
    expect(store.items('sportLevels')).toBeNull();

    await store.load();
    expect(store.error()).toBeNull();
    expect(store.items('sportLevels')).toEqual(SPORT_LEVEL_ITEMS);
  });

  it('keeps what the server stored after a save, and leaves the other catalog alone', async () => {
    await store.load();
    const items = [{ code: 'beginner', label: 'Inicial', order: 1, active: true }];

    await store.save('sportLevels', items);

    expect(repository.save).toHaveBeenCalledWith('sportLevels', items);
    expect(store.items('sportLevels')).toEqual(items);
    expect(store.items('sportGoals')).toEqual(SPORT_GOAL_ITEMS);
  });

  it('keeps the stored list when a save is rejected', async () => {
    await store.load();
    repository.save.mockRejectedValueOnce(new ApiError(400, 'invalid-argument', 'x'));

    await expect(store.save('sportLevels', [])).rejects.toBeInstanceOf(ApiError);

    expect(store.items('sportLevels')).toEqual(SPORT_LEVEL_ITEMS);
  });
});
