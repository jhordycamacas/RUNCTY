import { Provider } from '@angular/core';
import { GoogleMapsLoader } from './google-maps-loader';
import { MAP_RENDERER, MapRenderer } from './map-renderer';

const FALLBACK_NOTICE = 'No pudimos cargar Google Maps; mostramos el mapa de OpenStreetMap.';

/** Leaflet with OpenStreetMap: the map with no key, and the fallback when Google cannot load. */
function leaflet(notice: string | null): Promise<MapRenderer> {
  return import('./leaflet-map-renderer').then((module) => new module.LeafletMapRenderer(notice));
}

/**
 * Picks the map provider: Google Maps when the environment has a browser API key, otherwise (no
 * key, script blocked, offline, timeout) Leaflet with OpenStreetMap, so a map is never blank. A
 * key Google refuses later is handled by `GoogleMapRenderer`, which swaps to the same fallback.
 * The Google loader is created once, however many maps the app opens.
 */
export function mapRendererLoader(
  apiKey: string | null,
  createLoader: (apiKey: string) => GoogleMapsLoader = (key) => new GoogleMapsLoader(key),
): () => Promise<MapRenderer> {
  if (!apiKey) return () => leaflet(null);

  const google = createLoader(apiKey);
  const fallback = () => leaflet(FALLBACK_NOTICE);
  return () =>
    google
      .load()
      .then(
        (maps) =>
          import('./google-map-renderer').then(
            (module) =>
              new module.GoogleMapRenderer(
                maps,
                (listener) => google.onAuthFailure(listener),
                fallback,
              ),
          ),
        fallback,
      );
}

export function provideMapRenderer(apiKey: string | null): Provider {
  return { provide: MAP_RENDERER, useValue: mapRendererLoader(apiKey) };
}
