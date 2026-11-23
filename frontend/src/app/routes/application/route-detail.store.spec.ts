import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../core/errors/api-error';
import { RouteDetail, RouteRepository } from '../domain/route';
import { route, segment } from '../domain/testing/fixtures';
import { RouteDetailStore } from './route-detail.store';

const DETAIL: RouteDetail = { route: route('jipiro'), segments: [segment('s1')] };

describe('RouteDetailStore', () => {
  let get: ReturnType<typeof vi.fn<RouteRepository['get']>>;  let store: RouteDetailStore;

  beforeEach(() => {
    get = vi.fn<RouteRepository['get']>().mockResolvedValue(DETAIL);
    TestBed.configureTestingModule({
      providers: [RouteDetailStore, { provide: RouteRepository, useValue: { get } }],
    });
    store = TestBed.inject(RouteDetailStore);
  });

  it('is loading until the first answer, then ready', async () => {
    expect(store.status()).toBe('loading');

    await store.load('jipiro');

    expect(get).toHaveBeenCalledWith('jipiro');
    expect(store.status()).toBe('ready');
    expect(store.detail()).toEqual(DETAIL);
  });

  it('tells a route that no longer exists from a failed load', async () => {
    get.mockRejectedValueOnce(new ApiError(404, 'route-not-found', 'La ruta ya no existe.'));
    await store.load('jipiro');
    expect(store.status()).toBe('missing');
    expect(store.error()).toBeNull();

    get.mockRejectedValueOnce(new ApiError(0, 'network', 'sin conexión'));
    await store.load('jipiro');
    expect(store.status()).toBe('error');
    expect(store.error()).toBe('sin conexión');
  });

  describe('custom image', () => {
    const THUMB = 'data:image/jpeg;base64,AAAA';
    const FULL = 'data:image/jpeg;base64,BBBBBBBB';
    const WITH_IMAGE: RouteDetail = { route: route('jipiro', { imageThumb: THUMB }), segments: [] };
    let getImage: ReturnType<typeof vi.fn<RouteRepository['getImage']>>;

    beforeEach(() => {
      getImage = vi.fn<RouteRepository['getImage']>().mockResolvedValue(FULL);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [RouteDetailStore, { provide: RouteRepository, useValue: { get, getImage } }],
      });
      store = TestBed.inject(RouteDetailStore);
    });

    it('does not ask for the full image of a route without one', async () => {
      await store.load('jipiro');

      expect(getImage).not.toHaveBeenCalled();
      expect(store.fullImage()).toBeNull();
    });

    it('loads the full image after the detail', async () => {
      get.mockResolvedValue(WITH_IMAGE);

      await store.load('jipiro');
      await vi.waitFor(() => expect(store.fullImage()).toBe(FULL));

      expect(getImage).toHaveBeenCalledWith('jipiro');
      expect(store.status()).toBe('ready');
    });

    it('keeps the detail and no full image when the image fails to load', async () => {
      get.mockResolvedValue(WITH_IMAGE);
      getImage.mockRejectedValue(new ApiError(0, 'network', 'sin conexión'));

      await store.load('jipiro');
      await vi.waitFor(() => expect(getImage).toHaveBeenCalled());

      expect(store.status()).toBe('ready');
      expect(store.error()).toBeNull();
      expect(store.fullImage()).toBeNull();
    });
  });

  it('recovers on retry', async () => {
    get.mockRejectedValueOnce(new ApiError(0, 'network', 'sin conexión'));
    await store.load('jipiro');

    await store.load('jipiro');

    expect(store.status()).toBe('ready');
  });
});
