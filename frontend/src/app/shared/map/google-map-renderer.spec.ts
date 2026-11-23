import { GoogleMapRenderer } from './google-map-renderer';
import { MapRenderer, MapScene, MountedMap } from './map-renderer';
import { FakeGoogle, fakeGoogleMaps } from './testing/fake-google-maps';

describe('GoogleMapRenderer', () => {
  const start = { lat: -2.9, lng: -79.0 };
  const end = { lat: -2.91, lng: -79.01 };
  const scene: MapScene = {
    lines: [
      { points: [start, end], tone: 'safe' },
      { points: [end, { lat: -2.92, lng: -79.02 }], tone: 'danger' },
    ],
    markers: [
      { at: start, kind: 'start' },
      { at: { lat: -2.92, lng: -79.02 }, kind: 'end' },
    ],
    follow: false,
  };

  class FakeResizeObserver {
    static instances: FakeResizeObserver[] = [];
    disconnected = false;
    constructor(private readonly callback: () => void) {
      FakeResizeObserver.instances.push(this);
    }
    observe(): void {
      /* sizes are driven by the spec */
    }
    disconnect(): void {
      this.disconnected = true;
    }
    fire(): void {
      this.callback();
    }
  }

  let google: FakeGoogle;
  let host: HTMLElement;
  let authFailure: (() => void) | null;
  let unsubscribed: number;

  function sized(element: HTMLElement, width: number, height: number): void {
    Object.defineProperty(element, 'clientWidth', { value: width, configurable: true });
    Object.defineProperty(element, 'clientHeight', { value: height, configurable: true });
  }

  function mount(fallback: () => Promise<MapRenderer> = () => Promise.reject(new Error('none'))) {
    const renderer = new GoogleMapRenderer(
      google.api,
      (listener) => {
        authFailure = listener;
        return () => unsubscribed++;
      },
      fallback,
    );
    return renderer.mount(host, { notice: notices.push.bind(notices) });
  }
  const notices: (string | null)[] = [];

  beforeEach(() => {
    google = fakeGoogleMaps();
    host = document.createElement('div');
    sized(host, 400, 300);
    document.body.appendChild(host);
    authFailure = null;
    unsubscribed = 0;
    notices.length = 0;
    FakeResizeObserver.instances = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    const root = document.documentElement.style;
    root.setProperty('--rc-primary', '#ff2d95');
    root.setProperty('--rc-success', '#00ff88');
    root.setProperty('--rc-warning', '#ffcc00');
    root.setProperty('--rc-danger', '#ff3355');
    root.setProperty('--rc-page', '#0b0b0f');
    root.setProperty('--rc-text', '#ffffff');
    root.setProperty('--rc-surface', '#15151b');
    root.setProperty('--rc-border', '#2e2e3a');
    root.setProperty('--rc-text-muted', '#aaaaaa');
  });

  afterEach(() => {
    host.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.documentElement.removeAttribute('style');
  });

  it('draws each line with the color of its tone, resolved from the theme tokens', () => {
    mount().show(scene);

    expect(google.polylines.map((line) => line.options['strokeColor'])).toEqual([
      '#00ff88',
      '#ff3355',
    ]);
    expect(google.polylines[0].options['path']).toEqual([start, end]);
    expect(google.polylines.every((line) => line.map === google.maps[0])).toBe(true);
    expect(google.polylines.every((line) => line.options['clickable'] === false)).toBe(true);
  });

  it('draws the start and end markers and fits the map around everything', () => {
    mount().show(scene);

    expect(google.markers.map((marker) => marker.options['position'] as object)).toEqual([
      start,
      { lat: -2.92, lng: -79.02 },
    ]);
    expect(google.markers[0].options['icon']).toMatchObject({ fillColor: '#ff2d95' });
    expect(google.markers[1].options['icon']).toMatchObject({ fillColor: '#ffffff' });
    const fitted = google.maps[0].fitted;
    expect(fitted?.bounds.points).toHaveLength(6);
    expect(fitted?.padding).toBe(24);
  });

  it('does not zoom closer than street level when the scene is a single point', () => {
    const map = mount();
    map.show({ lines: [], markers: [{ at: start, kind: 'start' }], follow: false });
    google.maps[0].zoom = 21;

    google.idle();

    expect(google.maps[0].zoom).toBe(17);
  });

  it('frames once: a redraw keeps the view the person moved to', () => {
    const map = mount();
    map.show(scene);
    google.maps[0].fitted = null;

    map.show(scene);

    expect(google.maps[0].fitted).toBeNull();
  });

  it('waits for a size before framing a map that starts hidden', () => {
    sized(host, 0, 0);
    const map = mount();
    map.show(scene);
    expect(google.maps[0].fitted).toBeNull();

    sized(host, 400, 300);
    FakeResizeObserver.instances[0].fire();

    expect(google.maps[0].fitted).not.toBeNull();
  });

  it('replaces the drawing on every show, removing the previous overlays', () => {
    const map = mount();
    map.show(scene);
    const first = [...google.polylines, ...google.markers];

    map.show({ lines: [], markers: [], follow: false });

    expect(first.every((overlay) => overlay.map === null)).toBe(true);
  });

  it('follows the live position: centred, at least at street level, never framing the route', () => {
    const map = mount();
    const live: MapScene = {
      lines: scene.lines,
      markers: [{ at: end, kind: 'position' }],
      follow: true,
    };

    map.show(live);
    expect(google.maps[0].center).toEqual(end);
    expect(google.maps[0].zoom).toBe(17);
    expect(google.maps[0].fitted).toBeNull();

    google.maps[0].zoom = 19;
    map.show({ ...live, markers: [{ at: start, kind: 'position' }] });
    expect(google.maps[0].center).toEqual(start);
    expect(google.maps[0].zoom).toBe(19);
  });

  it('uses the dark map style, built from the theme tokens, only in the dark theme', () => {
    mount().show(scene);
    expect(google.maps[0].options['styles']).toBeUndefined();

    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) =>
      element === document.documentElement
        ? ({ colorScheme: 'dark' } as CSSStyleDeclaration)
        : real(element),
    );
    mount().show(scene);

    expect(JSON.stringify(google.maps[1].options['styles'])).toContain('#0b0b0f');
  });

  it('removes everything with the screen', () => {
    const map = mount();
    map.show(scene);
    const overlays = [...google.polylines, ...google.markers];

    map.destroy();

    expect(overlays.every((overlay) => overlay.map === null)).toBe(true);
    expect(FakeResizeObserver.instances[0].disconnected).toBe(true);
    expect(unsubscribed).toBe(1);
    expect(host.childNodes).toHaveLength(0);
  });

  describe('when Google refuses the key', () => {
    function leafletFallback() {
      const shown: MapScene[] = [];
      let mounted = 0;
      let destroyed = 0;
      const renderer: MapRenderer = {
        mount: (_host, hooks): MountedMap => {
          mounted++;
          hooks?.notice('Mostramos el mapa de OpenStreetMap.');
          return { show: (next) => shown.push(next), destroy: () => destroyed++ };
        },
      };
      return { renderer, shown, mounted: () => mounted, destroyed: () => destroyed };
    }

    it('swaps to the fallback in the same element, with the scene already drawn and a notice', async () => {
      const fallback = leafletFallback();
      const map = mount(() => Promise.resolve(fallback.renderer));
      map.show(scene);
      const overlays = [...google.polylines, ...google.markers];
      host.appendChild(document.createElement('div')); // Google's own error overlay

      authFailure?.();
      await vi.waitFor(() => expect(fallback.mounted()).toBe(1));

      expect(overlays.every((overlay) => overlay.map === null)).toBe(true);
      expect(host.childNodes).toHaveLength(0);
      expect(fallback.shown).toEqual([scene]);
      expect(notices).toContain('Mostramos el mapa de OpenStreetMap.');

      map.show({ ...scene, follow: true });
      expect(fallback.shown.at(-1)).toEqual({ ...scene, follow: true });
      map.destroy();
      expect(fallback.destroyed()).toBe(1);
    });

    it('does not mount the fallback if the screen is already gone', async () => {
      const fallback = leafletFallback();
      const map = mount(() => Promise.resolve(fallback.renderer));
      map.show(scene);

      authFailure?.();
      map.destroy();
      await Promise.resolve();

      expect(fallback.mounted()).toBe(0);
    });
  });
});
