import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../core/errors/api-error';
import { CityRecord, CityRepository } from '../domain/city';
import { CitiesStore } from './cities.store';

describe('CitiesStore', () => {
  let list: ReturnType<typeof vi.fn<() => Promise<CityRecord[]>>>;
  let store: CitiesStore;

  beforeEach(() => {
    list = vi.fn<() => Promise<CityRecord[]>>().mockResolvedValue([
      { id: 'quito', name: 'Quito', type: 'city' },
      { id: 'centro', name: 'Centro', type: 'zone' },
    ]);
    TestBed.configureTestingModule({
      providers: [{ provide: CityRepository, useValue: { list } }],
    });
    store = TestBed.inject(CitiesStore);
  });

  it('starts empty and not loaded', () => {
    expect(store.cities()).toBeNull();
  });

  it('loads the pickable cities once', async () => {
    await store.load();
    await store.load();

    expect(store.cities()).toEqual([{ id: 'quito', name: 'Quito', province: null }]);
    expect(store.byId().get('quito')?.name).toBe('Quito');
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('keeps the translated error and allows a retry', async () => {
    list.mockRejectedValueOnce(new ApiError(0, 'network', 'No hay conexión con el servidor.'));

    await store.load();
    expect(store.cities()).toBeNull();
    expect(store.error()).toBe('No hay conexión con el servidor.');

    await store.load();
    expect(store.error()).toBeNull();
    expect(store.cities()).toHaveLength(1);
  });
});
