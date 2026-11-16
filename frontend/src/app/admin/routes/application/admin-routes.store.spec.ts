import { TestBed } from '@angular/core/testing';
import { CityRepository } from '../../../cities/domain/city';
import { ApiError } from '../../../core/errors/api-error';
import { route } from '../../../routes/domain/testing/fixtures';
import { RouteAdminRepository, RouteInput } from '../domain/managed-route';
import {
  FakeRouteAdminRepository,
  fakeRouteAdminRepository,
} from '../testing/fake-route-admin.repository';
import { AdminRoutesStore } from './admin-routes.store';

const INPUT: RouteInput = {
  name: 'Parque Jipiro',
  cityId: 'quito',
  description: '',
  start: { label: 'A', lat: -3.9, lng: -79.2 },
  end: { label: 'B', lat: -3.91, lng: -79.21 },
  distanceKm: 3,
  elevationGainM: 0,
  surface: 'asphalt',
  difficulty: 'beginner',
  active: true,
};

describe('AdminRoutesStore', () => {
  let repository: FakeRouteAdminRepository;
  let cities: ReturnType<typeof vi.fn<CityRepository['list']>>;
  let store: AdminRoutesStore;

  beforeEach(() => {
    repository = fakeRouteAdminRepository();
    cities = vi.fn<CityRepository['list']>().mockResolvedValue([
      { id: 'loja', name: 'Loja' },
      { id: 'quito', name: 'Quito' },
    ]);
    TestBed.configureTestingModule({
      providers: [
        AdminRoutesStore,
        { provide: RouteAdminRepository, useValue: repository },
        { provide: CityRepository, useValue: { list: cities } },
      ],
    });
    store = TestBed.inject(AdminRoutesStore);
  });

  it('lists the routes of every city until one is selected, inactive ones included', async () => {
    repository.list.mockResolvedValue([route('a'), route('b', { active: false })]);

    await store.load();

    expect(repository.list).toHaveBeenCalledWith(null);
    expect(store.routes()?.map((r) => r.id)).toEqual(['a', 'b']);
    expect(store.loading()).toBe(false);
  });

  it('reloads for the selected city and drops the routes of the previous one', async () => {
    repository.list.mockResolvedValueOnce([route('a')]);
    await store.load();

    let resolve!: (routes: ReturnType<typeof route>[]) => void;
    repository.list.mockReturnValueOnce(new Promise((done) => (resolve = done)));
    const loading = store.selectCity('loja');

    expect(store.cityId()).toBe('loja');
    expect(store.routes()).toBeNull();

    resolve([route('l', { cityId: 'loja' })]);
    await loading;
    expect(repository.list).toHaveBeenLastCalledWith('loja');
    expect(store.routes()?.map((r) => r.id)).toEqual(['l']);
  });

  it('ignores a list that arrives after another city was selected', async () => {
    let late!: (routes: ReturnType<typeof route>[]) => void;
    repository.list.mockReturnValueOnce(new Promise((done) => (late = done)));
    const first = store.selectCity('loja');
    repository.list.mockResolvedValueOnce([route('q', { cityId: 'quito' })]);
    await store.selectCity('quito');

    late([route('l', { cityId: 'loja' })]);
    await first;

    expect(store.routes()?.map((r) => r.id)).toEqual(['q']);
  });

  it('keeps the error to offer a retry', async () => {
    repository.list.mockRejectedValueOnce(
      new ApiError(0, 'network', 'No hay conexión con el servidor.'),
    );

    await store.load();

    expect(store.routes()).toBeNull();
    expect(store.error()).toBe('No hay conexión con el servidor.');

    repository.list.mockResolvedValueOnce([route('a')]);
    await store.load();
    expect(store.error()).toBeNull();
    expect(store.routes()).toHaveLength(1);
  });

  it('filters the list by name or description', async () => {
    repository.list.mockResolvedValue([
      route('a', { name: 'Parque Jipiro' }),
      route('b', { name: 'Lineal', description: 'Junto al río' }),
    ]);
    await store.load();

    store.query.set('rio');

    expect(store.visibleRoutes().map((r) => r.id)).toEqual(['b']);
  });

  it('loads the places once, cities and zones', async () => {
    await store.loadPlaces();
    await store.loadPlaces();

    expect(cities).toHaveBeenCalledOnce();
    expect(store.places()?.map((p) => p.id)).toEqual(['loja', 'quito']);
    expect(store.placeName('quito')).toBe('Quito');
  });

  it('creates a route and switches to its city so it shows in the list', async () => {
    await store.selectCity('loja');

    const id = await store.saveRoute(null, INPUT);

    expect(id).toBe('new-id');
    expect(repository.createRoute).toHaveBeenCalledWith(INPUT);
    expect(store.cityId()).toBe('quito');
  });

  it('updates a route and keeps the "all cities" view', async () => {
    const id = await store.saveRoute('r1', INPUT);

    expect(id).toBe('r1');
    expect(repository.updateRoute).toHaveBeenCalledWith('r1', INPUT);
    expect(store.cityId()).toBeNull();
  });

  it('removes a deleted route from the list', async () => {
    repository.list.mockResolvedValue([route('a'), route('b')]);
    await store.load();

    await store.deleteRoute('a');

    expect(repository.deleteRoute).toHaveBeenCalledWith('a');
    expect(store.routes()?.map((r) => r.id)).toEqual(['b']);
  });

  it('reads a route to edit it', async () => {
    expect((await store.getRoute('r1')).id).toBe('r1');
    expect(repository.get).toHaveBeenCalledWith('r1');
  });
});
