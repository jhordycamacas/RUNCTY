import { InjectionToken } from '@angular/core';

/**
 * The map port: what the screens ask a map to show, independent of the map provider. Google Maps
 * implements it when the environment has `googleMapsApiKey` (`google-map-renderer.ts`); Leaflet with
 * OpenStreetMap tiles is the fallback with no key, or when Google cannot load (`leaflet-map-renderer.ts`).
 * `provideMapRenderer` (`map-renderer-provider.ts`) picks one.
 */
export interface MapPoint {
  lat: number;
  lng: number;
}

/** `route` is the neon line; `safe`, `caution` and `danger` are the safety levels of a stretch. */
export type MapTone = 'route' | 'safe' | 'caution' | 'danger';

export interface MapLine {
  points: readonly MapPoint[];
  tone: MapTone;
}

export type MapMarkerKind = 'start' | 'end' | 'position';

export interface MapMarker {
  at: MapPoint;
  kind: MapMarkerKind;
}

/**
 * Everything drawn at once. With `follow` the map keeps the `position` marker centred (a live
 * run); otherwise it frames all the lines and markers the first time they appear.
 */
export interface MapScene {
  lines: readonly MapLine[];
  markers: readonly MapMarker[];
  follow: boolean;
  /**
   * Where to look while there is nothing to frame yet (e.g. the city of a route that has no points
   * yet). Applied once, on the first scene; later scenes never move the map by themselves.
   */
  view?: { center: MapPoint; zoom: number };
}

/** A map mounted in an element. */
export interface MountedMap {
  show(scene: MapScene): void;
  destroy(): void;
}

/** What a renderer can tell the screen that hosts the map. */
export interface MapHooks {
  /** A short message to show over the map (e.g. «mostramos OpenStreetMap»), or null to clear it. */
  notice(text: string | null): void;
  /** The user clicked (or tapped) the map at this point. */
  click?(point: MapPoint): void;
}

export abstract class MapRenderer {
  abstract mount(host: HTMLElement, hooks?: MapHooks): MountedMap;
}

/**
 * Loads the renderer on demand, so the map library only reaches the screens that show a map. The
 * app provides it with `provideMapRenderer`; unit tests replace it (see
 * `testing/fake-map-renderer.ts`): a real map needs a laid-out DOM.
 */
export const MAP_RENDERER = new InjectionToken<() => Promise<MapRenderer>>('MAP_RENDERER');
