import { TestBed } from '@angular/core/testing';
import { GoogleMapRenderer } from './google-map-renderer';
import { GoogleMapsApi, GoogleMapsLoader } from './google-maps-loader';
import { LeafletMapRenderer } from './leaflet-map-renderer';
import { MAP_RENDERER } from './map-renderer';
import { mapRendererLoader, provideMapRenderer } from './map-renderer-provider';
import { fakeGoogleMaps } from './testing/fake-google-maps';

describe('mapRendererLoader', () => {
  function loaderStub(outcome: Promise<GoogleMapsApi>) {
    return {
      load: vi.fn(() => outcome),
      onAuthFailure: vi.fn(() => () => undefined),
    } as unknown as GoogleMapsLoader;
  }

  it('uses Leaflet when there is no key, without ever touching Google', async () => {
    const google = loaderStub(Promise.resolve(fakeGoogleMaps().api));

    const renderer = await mapRendererLoader(null, () => google)();

    expect(renderer).toBeInstanceOf(LeafletMapRenderer);
    expect(google.load).not.toHaveBeenCalled();
  });

  it('uses Google Maps when there is a key and the API loads', async () => {
    const google = loaderStub(Promise.resolve(fakeGoogleMaps().api));

    const renderer = await mapRendererLoader('browser-key', () => google)();

    expect(renderer).toBeInstanceOf(GoogleMapRenderer);
  });

  it('builds a single Google loader however many maps are opened', async () => {
    const create = vi.fn(() => loaderStub(Promise.resolve(fakeGoogleMaps().api)));
    const load = mapRendererLoader('browser-key', create);

    await load();
    await load();

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith('browser-key');
  });

  it('falls back to Leaflet, with a notice, when Google cannot load', async () => {
    const google = loaderStub(Promise.reject(new Error('offline')));

    const renderer = await mapRendererLoader('browser-key', () => google)();

    expect(renderer).toBeInstanceOf(LeafletMapRenderer);
    expect((renderer as LeafletMapRenderer).notice).toContain('OpenStreetMap');
  });

  it('is what the app injects as MAP_RENDERER', async () => {
    TestBed.configureTestingModule({ providers: [provideMapRenderer(null)] });

    const renderer = await TestBed.inject(MAP_RENDERER)();

    expect(renderer).toBeInstanceOf(LeafletMapRenderer);
  });
});
