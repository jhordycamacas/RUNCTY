import { GoogleMapsApi } from '../google-maps-loader';

interface Latlng {
  lat: number;
  lng: number;
}

export class FakeGoogleMap {
  zoom: number | null = null;
  center: Latlng | null = null;
  fitted: { bounds: FakeBounds; padding: number } | null = null;
  constructor(
    readonly host: HTMLElement,
    readonly options: Record<string, unknown>,
  ) {}
  setCenter(center: Latlng): void {
    this.center = center;
  }
  setZoom(zoom: number): void {
    this.zoom = zoom;
  }
  getZoom(): number | null {
    return this.zoom;
  }
  setOptions(options: Record<string, unknown>): void {
    Object.assign(this.options, options);
  }
  fitBounds(bounds: FakeBounds, padding: number): void {
    this.fitted = { bounds, padding };
  }
}

export class FakeBounds {
  readonly points: Latlng[] = [];
  extend(point: Latlng): this {
    this.points.push(point);
    return this;
  }
}

/** A `Polyline` or a `Marker`: it records its options and the map it is on (null once removed). */
export class FakeOverlay {
  map: FakeGoogleMap | null;
  constructor(readonly options: Record<string, unknown> & { map?: FakeGoogleMap }) {
    this.map = options.map ?? null;
  }
  setMap(map: FakeGoogleMap | null): void {
    this.map = map;
  }
}

export interface FakeGoogle {
  api: GoogleMapsApi;
  maps: FakeGoogleMap[];
  polylines: FakeOverlay[];
  markers: FakeOverlay[];
  /** Runs the callbacks registered for the map's next `idle` event. */
  idle(): void;
}

/** A stand-in for `google.maps` that records what the renderer draws, with no network. */
export function fakeGoogleMaps(): FakeGoogle {
  const fake: FakeGoogle = {
    maps: [],
    polylines: [],
    markers: [],
    idle: () => {
      const callbacks = idleCallbacks.splice(0);
      for (const callback of callbacks) callback();
    },
    api: undefined as unknown as GoogleMapsApi,
  };
  const idleCallbacks: (() => void)[] = [];

  class Map extends FakeGoogleMap {
    constructor(host: HTMLElement, options: Record<string, unknown>) {
      super(host, options);
      fake.maps.push(this);
    }
  }
  class Polyline extends FakeOverlay {
    constructor(options: Record<string, unknown>) {
      super(options);
      fake.polylines.push(this);
    }
  }
  class Marker extends FakeOverlay {
    constructor(options: Record<string, unknown>) {
      super(options);
      fake.markers.push(this);
    }
  }

  fake.api = {
    Map,
    Polyline,
    Marker,
    LatLngBounds: FakeBounds,
    SymbolPath: { CIRCLE: 0 },
    event: {
      addListenerOnce: (_map: unknown, _name: string, callback: () => void) => {
        idleCallbacks.push(callback);
      },
    },
  } as unknown as GoogleMapsApi;
  return fake;
}
