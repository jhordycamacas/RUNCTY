import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/errors/api-error';
import { Route, RouteRepository } from '../domain/route';
import { route } from '../domain/testing/fixtures';
import { RoutesStore } from './routes.store';

describe('RoutesStore', () => {
  let listByCity: ReturnType<typeof vi.fn<RouteRepository['listByCity']>>;
  let session: ReturnType<typeof signal<{ uid: string } | null>>;
  let store: RoutesStore;
  const LOJA: Route[] = [route('jipiro')];

  beforeEach(() => {
    listByCity = vi
      .fn<RouteRepository['listByCity']>()
      .mockImplementation(async (cityId) => (cityId === 'loja' ? LOJA : [route('quito-1')]));
    session = signal({ uid: 'u1' });
    TestBed.configureTestingModule({
      providers: [
        { provide: RouteRepository, useValue: { listByCity } },
        { provide: AuthService, useValue: { session } },
      ],
    });
    store = TestBed.inject(RoutesStore);
  });

  it('has no routes until the first load', () => {
    expect(store.routes()).toBeNull();
  });

  it('loads the routes once and keeps them', async () => {
    await store.load('loja');
    await store.load('loja');

    expect(store.routes()).toEqual(LOJA);
    expect(listByCity).toHaveBeenCalledTimes(1);
  });

  it('reloads when forced', async () => {
    await store.load('loja');
    await store.load('loja', true);

    expect(listByCity).toHaveBeenCalledTimes(2);
  });

  it('shows the translated error and recovers on retry', async () => {
    listByCity.mockRejectedValueOnce(
      new ApiError(0, 'network', 'No hay conexión con el servidor.'),
    );

    await store.load('loja');
    expect(store.routes()).toBeNull();
    expect(store.error()).toBe('No hay conexión con el servidor.');

    await store.load('loja');
    expect(store.error()).toBeNull();
    expect(store.routes()).toEqual(LOJA);
  });

  it('keeps the routes on screen when a forced reload fails', async () => {
    await store.load('loja');
    listByCity.mockRejectedValueOnce(new ApiError(0, 'network', 'sin conexión'));

    await store.load('loja', true);

    expect(store.routes()).toEqual(LOJA);
    expect(store.error()).toBe('sin conexión');
  });

  it('does not show the routes of another city', async () => {
    await store.load('loja');

    const next = store.load('quito');
    expect(store.routes()).toBeNull();
    await next;

    expect(store.routes()?.map((r) => r.id)).toEqual(['quito-1']);
  });

  it('forgets the routes of the previous user', async () => {
    await store.load('loja');

    session.set({ uid: 'u2' });

    expect(store.routes()).toBeNull();
  });
});
