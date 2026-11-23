import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../../core/errors/api-error';
import { CityAdminRepository, CityCreateInput } from '../domain/managed-city';
import {
  FakeCityAdminRepository,
  city,
  fakeCityAdminRepository,
  zone,
} from '../testing/fake-city-admin.repository';
import { AdminCitiesStore } from './admin-cities.store';

const INPUT: CityCreateInput = {
  id: 'z1',
  type: 'Zona',
  name: 'Centro',
  province: 'Loja',
  location: { lat: 1, lng: 2 },
  coverage: 'active',
  parentCityId: 'loja',
};

describe('AdminCitiesStore', () => {
  let repository: FakeCityAdminRepository;
  let store: AdminCitiesStore;

  beforeEach(() => {
    repository = fakeCityAdminRepository();
    repository.list.mockResolvedValue([city('loja', { name: 'Loja' }), zone('z1', 'loja'), city('quito')]);
    TestBed.configureTestingModule({
      providers: [AdminCitiesStore, { provide: CityAdminRepository, useValue: repository }],
    });
    store = TestBed.inject(AdminCitiesStore);
  });

  it('has nothing until the catalogue is loaded, then groups the zones under their city', async () => {
    expect(store.groups()).toBeNull();

    await store.load();

    expect(store.groups()?.map((g) => [g.city.id, g.zones.map((z) => z.id)])).toEqual([
      ['loja', ['z1']],
      ['quito', []],
    ]);
    expect(store.error()).toBeNull();
    expect(store.loading()).toBe(false);
  });

  it('offers only top-level places as a parent', async () => {
    await store.load();

    expect(store.parentOptions().map((c) => c.id)).toEqual(['loja', 'quito']);
  });

  it('keeps the loaded catalogue and reports the failure of a reload', async () => {
    await store.load();
    repository.list.mockRejectedValueOnce(new ApiError(0, 'network', 'Sin conexión.'));

    await store.load();

    expect(store.groups()).toHaveLength(2);
    expect(store.error()).toBe('Sin conexión.');
  });

  it('names a city by its id, falling back to the id', async () => {
    await store.load();

    expect(store.cityName('loja')).toBe('Loja');
    expect(store.cityName('ghost')).toBe('ghost');
  });

  it('finds a city asking the API, or null when it is gone', async () => {
    expect((await store.find('quito'))?.id).toBe('quito');
    expect(await store.find('ghost')).toBeNull();
  });

  it('creates a city or zone with its identity', async () => {
    await store.save(null, INPUT);

    expect(repository.create).toHaveBeenCalledWith(INPUT);
  });

  it('updates without the id', async () => {
    await store.save('z1', INPUT);

    expect(repository.update).toHaveBeenCalledWith('z1', {
      name: 'Centro',
      province: 'Loja',
      type: 'Zona',
      location: { lat: 1, lng: 2 },
      coverage: 'active',
      parentCityId: 'loja',
    });
  });

  it('drops a deleted city from the catalogue', async () => {
    await store.load();

    await store.remove('z1');

    expect(repository.delete).toHaveBeenCalledWith('z1');
    expect(store.groups()?.[0].zones).toEqual([]);
  });

  it('keeps the city when the deletion fails', async () => {
    await store.load();
    repository.delete.mockRejectedValueOnce(new ApiError(412, 'city-has-routes', 'Tiene rutas.'));

    await expect(store.remove('loja')).rejects.toThrow('Tiene rutas.');

    expect(store.groups()).toHaveLength(2);
  });
});
