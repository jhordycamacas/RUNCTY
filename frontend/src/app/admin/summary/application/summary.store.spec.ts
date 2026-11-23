import { TestBed } from '@angular/core/testing';
import { CityRepository } from '../../../cities/domain/city';
import { CatalogRepository } from '../../../core/catalogs/catalog';
import { fakeCatalogRepository } from '../../../core/catalogs/testing/fake-catalog.repository';
import { ApiError } from '../../../core/errors/api-error';
import { SummaryRepository } from '../domain/summary';
import { summaryFixture } from '../testing/summary-fixtures';
import { SummaryStore } from './summary.store';

describe('SummaryStore', () => {
  let get: ReturnType<typeof vi.fn<SummaryRepository['get']>>;
  let catalogs: ReturnType<typeof fakeCatalogRepository>;
  let cities: ReturnType<typeof vi.fn<CityRepository['list']>>;
  let store: SummaryStore;

  beforeEach(() => {
    get = vi.fn<SummaryRepository['get']>().mockResolvedValue(summaryFixture());
    catalogs = fakeCatalogRepository();
    cities = vi
      .fn<CityRepository['list']>()
      .mockResolvedValue([{ id: 'loja', name: 'Loja', type: 'city' }]);
    TestBed.configureTestingModule({
      providers: [
        SummaryStore,
        { provide: SummaryRepository, useValue: { get } },
        { provide: CatalogRepository, useValue: catalogs },
        { provide: CityRepository, useValue: { list: cities } },
      ],
    });
    store = TestBed.inject(SummaryStore);
  });

  it('names the cities of the latest accounts once the summary is loaded', async () => {
    expect(store.cityNames().size).toBe(0);

    await store.load();

    expect(store.cityNames().get('loja')).toBe('Loja');
  });

  it('shows the summary even when the cities cannot be loaded', async () => {
    cities.mockRejectedValue(new ApiError(500, 'internal', 'No.'));

    await store.load();

    expect(store.summary()).not.toBeNull();
    expect(store.cityNames().size).toBe(0);
  });

  it('starts without data, not loading and without error', () => {
    expect(store.summary()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('loads the summary and flags loading meanwhile', async () => {
    const loading = store.load();
    expect(store.loading()).toBe(true);
    await loading;

    expect(store.loading()).toBe(false);
    expect(store.summary()?.users?.total).toBe(12);
  });

  it('shows the Spanish message of a failure and keeps no data', async () => {
    get.mockRejectedValue(new ApiError(500, 'internal', 'Algo salió mal.'));

    await store.load();

    expect(store.error()).toBe('Algo salió mal.');
    expect(store.summary()).toBeNull();
  });

  it('keeps the previous figures when a refresh fails, and clears the error on retry', async () => {
    await store.load();
    get.mockRejectedValueOnce(new ApiError(500, 'internal', 'Falló.'));
    await store.load();
    expect(store.summary()).not.toBeNull();
    expect(store.error()).toBe('Falló.');

    await store.load();

    expect(store.error()).toBeNull();
  });

  it('is empty when there are no blocks to show', async () => {
    get.mockResolvedValue(summaryFixture({ users: null, routes: null, cities: null }));

    await store.load();

    expect(store.isEmpty()).toBe(true);
  });

  it('is not empty when any block has data', async () => {
    await store.load();

    expect(store.isEmpty()).toBe(false);
  });

  describe('sport level labels', () => {
    it('names a level with its catalog label and keeps the raw code of an unknown one', async () => {
      await store.load();

      expect(store.levelLabel('beginner')).toBe('Principiante');
      expect(store.levelLabel('legacy-code')).toBe('legacy-code');
    });

    it('falls back to the raw codes, and still shows the figures, when the catalog fails', async () => {
      catalogs.list.mockRejectedValue(new ApiError(500, 'internal', 'Sin catálogo.'));

      await store.load();

      expect(store.error()).toBeNull();
      expect(store.summary()?.users?.total).toBe(12);
      expect(store.levelLabel('beginner')).toBe('beginner');
    });
  });
});
