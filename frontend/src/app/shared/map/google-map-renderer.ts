import { GoogleMapsApi } from './google-maps-loader';
import {
  MapHooks,
  MapMarkerKind,
  MapRenderer,
  MapScene,
  MapTone,
  MountedMap,
} from './map-renderer';

/** Ecuador as a whole, while there is nothing to show yet. */
const DEFAULT_CENTER = { lat: -1.5, lng: -78.5 };
const DEFAULT_ZOOM = 6;
/** Street level, to follow a runner. */
const FOLLOW_ZOOM = 17;
const FRAME_PADDING = 24;

/** Theme tokens that color the lines and the markers (the same ones `map-view.ts` gives Leaflet). */
const LINE_TOKENS: Record<MapTone, string> = {
  route: '--rc-primary',
  safe: '--rc-success',
  caution: '--rc-warning',
  danger: '--rc-danger',
};
const MARKER_FILL_TOKENS: Record<MapMarkerKind, string> = {
  start: '--rc-primary',
  position: '--rc-primary',
  end: '--rc-text',
};

type Token = (name: string) => string;

/** Google paints with concrete colors, not CSS variables, so the tokens are resolved when drawing. */
function tokenReader(host: HTMLElement): Token {
  const style = getComputedStyle(host);
  return (name) => style.getPropertyValue(name).trim();
}

/**
 * The dark map: Google's base map restyled with the dark theme tokens. A style array (not a cloud
 * `mapId`) keeps the map working with only an API key and no Google Cloud map configuration.
 */
function darkStyles(token: Token): google.maps.MapTypeStyle[] {
  const page = token('--rc-page');
  const surface = token('--rc-surface');
  const border = token('--rc-border');
  const muted = token('--rc-text-muted');
  return [
    { elementType: 'geometry', stylers: [{ color: page }] },
    { elementType: 'labels.text.fill', stylers: [{ color: muted }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: page }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: border }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: surface }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ];
}

function isDarkTheme(): boolean {
  return getComputedStyle(document.documentElement).colorScheme === 'dark';
}

/**
 * The map port with Google Maps (Maps JavaScript API). `maps` is the loaded `google.maps`. When
 * Google refuses the API key it reports it late, after the map exists (`onAuthFailure`): the map
 * is then replaced, in the same element, by the `fallback` renderer (Leaflet), keeping the scene.
 */
export class GoogleMapRenderer extends MapRenderer {
  constructor(
    private readonly maps: GoogleMapsApi,
    private readonly onAuthFailure: (listener: () => void) => () => void,
    private readonly fallback: () => Promise<MapRenderer>,
  ) {
    super();
  }

  mount(host: HTMLElement, hooks?: MapHooks): MountedMap {
    let active = this.mountGoogle(host, hooks);
    let latest: MapScene | null = null;
    let destroyed = false;

    const stopListening = this.onAuthFailure(() => {
      if (destroyed) return;
      active.destroy();
      this.fallback().then((renderer) => {
        if (destroyed) return;
        active = renderer.mount(host, hooks);
        if (latest) active.show(latest);
      });
    });

    return {
      show(scene: MapScene): void {
        latest = scene;
        active.show(scene);
      },
      destroy(): void {
        destroyed = true;
        stopListening();
        active.destroy();
      },
    };
  }

  private mountGoogle(host: HTMLElement, hooks?: MapHooks): MountedMap {
    const maps = this.maps;
    const map = new maps.Map(host, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      clickableIcons: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) hooks?.click?.({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    });
    let overlays: (google.maps.Polyline | google.maps.Marker)[] = [];
    let dark = false;
    let framed = false;
    // What to frame once the map has a size: a hidden tab or a page still in its transition is
    // 0×0, and fitting then would pick a wrong zoom.
    let pendingFrame: google.maps.LatLngBounds | null = null;
    const frame = () => {
      if (!pendingFrame || host.clientWidth === 0 || host.clientHeight === 0) return;
      map.fitBounds(pendingFrame, FRAME_PADDING);
      pendingFrame = null;
      // fitBounds zooms in as far as it can on a single point; keep street level at most.
      maps.event.addListenerOnce(map, 'idle', () => {
        if ((map.getZoom() ?? 0) > FOLLOW_ZOOM) map.setZoom(FOLLOW_ZOOM);
      });
    };
    const resize = new ResizeObserver(frame);
    resize.observe(host);

    const clear = () => {
      for (const overlay of overlays) overlay.setMap(null);
      overlays = [];
    };

    return {
      show: (scene: MapScene): void => {
        const token = tokenReader(host);
        const wantsDark = isDarkTheme();
        if (wantsDark !== dark) {
          dark = wantsDark;
          map.setOptions({ styles: dark ? darkStyles(token) : null });
        }

        clear();
        const bounds = new maps.LatLngBounds();
        let drawn = 0;
        for (const line of scene.lines) {
          for (const point of line.points) {
            bounds.extend(point);
            drawn++;
          }
          overlays.push(
            new maps.Polyline({
              map,
              path: [...line.points],
              strokeColor: token(LINE_TOKENS[line.tone]),
              strokeOpacity: 1,
              strokeWeight: 5,
              clickable: false,
            }),
          );
        }
        for (const marker of scene.markers) {
          bounds.extend(marker.at);
          drawn++;
          overlays.push(
            new maps.Marker({
              map,
              position: marker.at,
              clickable: false,
              icon: {
                path: maps.SymbolPath.CIRCLE,
                scale: marker.kind === 'position' ? 8 : 7,
                fillColor: token(MARKER_FILL_TOKENS[marker.kind]),
                fillOpacity: 1,
                strokeColor: token('--rc-page'),
                strokeWeight: 3,
              },
            }),
          );
        }

        const position = scene.markers.find((marker) => marker.kind === 'position');
        if (scene.follow && position) {
          map.setCenter(position.at);
          if ((map.getZoom() ?? 0) < FOLLOW_ZOOM) map.setZoom(FOLLOW_ZOOM);
        } else if (!framed && drawn > 0) {
          pendingFrame = bounds;
          framed = true;
          frame();
        } else if (!framed && scene.view) {
          map.setCenter(scene.view.center);
          map.setZoom(scene.view.zoom);
          framed = true;
        }
      },
      destroy: (): void => {
        resize.disconnect();
        clear();
        host.replaceChildren();
      },
    };
  }
}
