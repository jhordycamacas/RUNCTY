import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import { ApiError } from '../../core/errors/api-error';
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

  it('keeps the thumbnail of a route only when it is an image data URL', async () => {
    const thumb = 'data:image/jpeg;base64,AAAA';
    get.mockReturnValue(
      of({
        routes: [
          { id: 'a', imageThumb: thumb },
          { id: 'b', imageThumb: 'https://example.com/x.jpg' },
          { id: 'c', imageThumb: null },
          { id: 'd' },
        ],
      }),
    );

    const routes = await repository.listByCity('loja');

    expect(routes.map((route) => route.imageThumb)).toEqual([thumb, null, null, null]);
  });

  it('reads the full image of a route, encoding the id', async () => {
    get.mockReturnValue(of({ image: 'data:image/png;base64,AAAA' }));

    expect(await repository.getImage('a/b')).toBe('data:image/png;base64,AAAA');
    expect(get).toHaveBeenCalledWith('/routes/a%2Fb/image');
  });

  it('answers null when the route has no image, but not for other failures', async () => {
    get.mockReturnValueOnce(
      throwError(() => new ApiError(404, 'route-image-not-found', 'Sin imagen.')),
    );
    expect(await repository.getImage('r1')).toBeNull();

    const failure = new ApiError(0, 'network', 'sin conexión');
    get.mockReturnValueOnce(throwError(() => failure));
    await expect(repository.getImage('r1')).rejects.toBe(failure);
  });

  it('ignores an image that is not a data URL', async () => {
    get.mockReturnValue(of({ image: 'javascript:alert(1)' }));

    expect(await repository.getImage('r1')).toBeNull();
  });
});
