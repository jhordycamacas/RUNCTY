import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import { HttpRouteRepository } from './http-route.repository';

describe('HttpRouteRepository', () => {
  let get: ReturnType<typeof vi.fn>;
  let repository: HttpRouteRepository;

  beforeEach(() => {
    get = vi.fn();
    TestBed.configureTestingModule({
      providers: [HttpRouteRepository, { provide: ApiClient, useValue: { get } }],
    });
    repository = TestBed.inject(HttpRouteRepository);
  });

  it('lists the routes of a city and maps them to the domain', async () => {
    get.mockReturnValue(of({ routes: [{ id: 'r1', name: 'Jipiro', distanceKm: 3 }] }));

    const routes = await repository.listByCity('loja');

    expect(get).toHaveBeenCalledWith('/routes', { cityId: 'loja' });
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({ id: 'r1', name: 'Jipiro', distanceKm: 3, safety: [] });
  });

  it('tolerates a response without the routes list', async () => {
    get.mockReturnValue(of({}));

    expect(await repository.listByCity('loja')).toEqual([]);
  });

  it('reads a route with its segments, encoding the id', async () => {
    get.mockReturnValue(of({ id: 'a/b', name: 'Ruta', segments: [{ id: 's1', order: 0 }] }));

    const detail = await repository.get('a/b');

    expect(get).toHaveBeenCalledWith('/routes/a%2Fb');
    expect(detail.route.id).toBe('a/b');
    expect(detail.segments.map((s) => s.id)).toEqual(['s1']);
  });
});
