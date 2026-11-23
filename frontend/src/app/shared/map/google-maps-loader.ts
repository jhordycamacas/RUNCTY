/// <reference types="google.maps" />

/** The Maps JavaScript API namespace (`google.maps`) once the libraries the renderer uses are in. */
export type GoogleMapsApi = typeof google.maps;

const SCRIPT_ID = 'google-maps-script';
const CALLBACK_NAME = '__runctyGoogleMapsReady';
const API_URL = 'https://maps.googleapis.com/maps/api/js';
const LOAD_TIMEOUT_MS = 15_000;

/** The slice of `window` the loader touches, so a spec can hand it a fake one. */
type MapsWindow = Window &
  typeof globalThis & {
    google?: { maps?: GoogleMapsApi };
    gm_authFailure?: () => void;
  };

/**
 * Loads the Maps JavaScript API once with the official dynamic-loading script
 * (`loading=async` plus `importLibrary`). Every caller gets the same promise, so the script is
 * never injected twice. It rejects when the script fails, never answers in time, or the API key is
 * refused: Google reports a refused key later, through the global `gm_authFailure`, which the
 * loader forwards to `onAuthFailure` listeners.
 */
export class GoogleMapsLoader {
  private loading: Promise<GoogleMapsApi> | null = null;
  private authFailed = false;
  private readonly authListeners = new Set<() => void>();

  constructor(
    private readonly apiKey: string,
    private readonly win: MapsWindow = window as MapsWindow,
    private readonly timeoutMs = LOAD_TIMEOUT_MS,
  ) {}

  load(): Promise<GoogleMapsApi> {
    this.loading ??= this.inject();
    return this.loading;
  }

  /** Calls `listener` when Google refuses the key, now if it already did. Returns the unsubscribe. */
  onAuthFailure(listener: () => void): () => void {
    if (this.authFailed) {
      listener();
      return () => undefined;
    }
    this.authListeners.add(listener);
    return () => this.authListeners.delete(listener);
  }

  private inject(): Promise<GoogleMapsApi> {
    const win = this.win;
    win.gm_authFailure = () => {
      this.authFailed = true;
      for (const listener of this.authListeners) listener();
      this.authListeners.clear();
    };

    return new Promise<GoogleMapsApi>((resolve, reject) => {
      const fail = (reason: string) => {
        window.clearTimeout(timer);
        this.loading = null;
        win.document.getElementById(SCRIPT_ID)?.remove();
        reject(new Error(reason));
      };
      const timer = window.setTimeout(() => fail('Google Maps timed out'), this.timeoutMs);

      Reflect.set(win, CALLBACK_NAME, () => {
        const maps = win.google?.maps;
        if (!maps) return fail('Google Maps did not define google.maps');
        Promise.all([maps.importLibrary('maps'), maps.importLibrary('marker')]).then(
          () => {
            window.clearTimeout(timer);
            resolve(maps);
          },
          fail.bind(null, 'Google Maps libraries failed'),
        );
      });

      const params = new URLSearchParams({
        key: this.apiKey,
        v: 'weekly',
        loading: 'async',
        libraries: 'maps,marker',
        language: 'es',
        callback: CALLBACK_NAME,
      });
      const script = win.document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `${API_URL}?${params}`;
      script.onerror = () => fail('Google Maps script failed to load');
      win.document.head.appendChild(script);
    });
  }
}
