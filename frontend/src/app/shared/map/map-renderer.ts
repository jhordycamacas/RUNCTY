import { InjectionToken } from '@angular/core';

/**
 * The map port: what the screens ask a map to show, independent of the map provider. Leaflet with
 * OpenStreetMap tiles implements it today (`leaflet-map-renderer.ts`); Google Maps can replace it
 * by providing another `MAP_RENDERER` once there is an API key.
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
}

/** A map mounted in an element. */
export interface MountedMap {
  show(scene: MapScene): void;
  destroy(): void;
}

export abstract class MapRenderer {
  abstract mount(host: HTMLElement): MountedMap;
}

/**
 * Loads the renderer on demand, so the map library only reaches the screens that show a map.
 * Unit tests replace it (see `testing/fake-map-renderer.ts`): a real map needs a laid-out DOM.
 */
export const MAP_RENDERER = new InjectionToken<() => Promise<MapRenderer>>('MAP_RENDERER', {
  providedIn: 'root',
  factory: () => () =>
    import('./leaflet-map-renderer').then((module) => new module.LeafletMapRenderer()),
});
