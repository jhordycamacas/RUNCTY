import * as L from 'leaflet';
import { MapHooks, MapRenderer, MapScene, MountedMap } from './map-renderer';

/** OpenStreetMap's standard tiles; the tile usage policy requires the attribution on the map. */
const TILES_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const MAX_ZOOM = 19;
/** Ecuador as a whole, while there is nothing to show yet. */
const DEFAULT_CENTER: L.LatLngExpression = [-1.5, -78.5];
const DEFAULT_ZOOM = 6;
/** Street level, to follow a runner. */
const FOLLOW_ZOOM = 17;

/** Leaflet's own stylesheet is a separate bundle (angular.json), linked the first time a map opens. */
const STYLESHEET_ID = 'leaflet-stylesheet';

function ensureStylesheet(): void {
  if (document.getElementById(STYLESHEET_ID)) return;
  const link = document.createElement('link');
  link.id = STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = 'leaflet.css';
  document.head.appendChild(link);
}

/**
 * The map port with Leaflet and OpenStreetMap: the real fallback of the app when there is no
 * Google Maps key or Google cannot load (`map-renderer-provider.ts`). Lines and markers are SVG
 * paths whose colors come from the theme tokens through their CSS classes (see `map-view.ts`), so
 * they follow the theme. `notice` is shown over the map when it stands in for Google.
 */
export class LeafletMapRenderer extends MapRenderer {
  constructor(readonly notice: string | null = null) {
    super();
  }

  mount(host: HTMLElement, hooks?: MapHooks): MountedMap {
    ensureStylesheet();
    hooks?.notice(this.notice);
    const map = L.map(host, { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer(TILES_URL, { maxZoom: MAX_ZOOM, attribution: ATTRIBUTION }).addTo(map);
    const layers = L.layerGroup().addTo(map);
    map.on('click', (event: L.LeafletMouseEvent) => {
      // Panning across the world copies makes longitudes beyond ±180: bring them back.
      const { lat, lng } = event.latlng.wrap();
      hooks?.click?.({ lat, lng });
    });
    let framed = false;
    // What to frame once the map has a size: a hidden tab or a page still in its transition is
    // 0×0, and fitting then would pick a wrong zoom.
    let pendingFrame: L.LatLngBounds | null = null;
    const frame = () => {
      if (!pendingFrame || host.clientWidth === 0 || host.clientHeight === 0) return;
      map.fitBounds(pendingFrame, { padding: [24, 24], maxZoom: FOLLOW_ZOOM });
      pendingFrame = null;
    };

    const resize = new ResizeObserver(() => {
      map.invalidateSize();
      frame();
    });
    resize.observe(host);

    return {
      show(scene: MapScene): void {
        layers.clearLayers();
        const points: L.LatLngTuple[] = [];
        for (const line of scene.lines) {
          const path = line.points.map(({ lat, lng }): L.LatLngTuple => [lat, lng]);
          points.push(...path);
          L.polyline(path, {
            className: `rc-map-line rc-map-line--${line.tone}`,
            weight: 5,
            lineCap: 'round',
            lineJoin: 'round',
            interactive: false,
          }).addTo(layers);
        }
        for (const marker of scene.markers) {
          points.push([marker.at.lat, marker.at.lng]);
          L.circleMarker([marker.at.lat, marker.at.lng], {
            className: `rc-map-marker rc-map-marker--${marker.kind}`,
            radius: marker.kind === 'position' ? 8 : 7,
            weight: 3,
            fillOpacity: 1,
            interactive: false,
          }).addTo(layers);
        }

        const position = scene.markers.find((marker) => marker.kind === 'position');
        if (scene.follow && position) {
          map.setView([position.at.lat, position.at.lng], Math.max(map.getZoom(), FOLLOW_ZOOM));
        } else if (!framed && points.length > 0) {
          pendingFrame = L.latLngBounds(points);
          framed = true;
          frame();
        } else if (!framed && scene.view) {
          const { center, zoom } = scene.view;
          map.setView([center.lat, center.lng], zoom);
          framed = true;
        }
      },
      destroy(): void {
        resize.disconnect();
        map.remove();
      },
    };
  }
}
