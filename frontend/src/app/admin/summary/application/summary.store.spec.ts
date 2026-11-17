import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../../core/errors/api-error';
import { SummaryRepository } from '../domain/summary';
import { summaryFixture } from '../testing/summary-fixtures';
import { SummaryStore } from './summary.store';

describe('SummaryStore', () => {
  let get: ReturnType<typeof vi.fn<SummaryRepository['get']>>;
  let store: SummaryStore;

  beforeEach(() => {
    get = vi.fn<SummaryRepository['get']>().mockResolvedValue(summaryFixture());
    TestBed.configureTestingModule({
      providers: [SummaryStore, { provide: SummaryRepository, useValue: { get } }],
    });
    store = TestBed.inject(SummaryStore);
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
});
