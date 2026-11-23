import { GoogleMapsLoader } from './google-maps-loader';

describe('GoogleMapsLoader', () => {
  const win = window as unknown as Record<string, unknown>;

  const scripts = () => document.head.querySelectorAll<HTMLScriptElement>('#google-maps-script');

  /** What Google's script does when it is ready: define `google.maps` and call the callback. */
  function scriptReady(importLibrary = () => Promise.resolve({})) {
    const maps = { importLibrary: vi.fn(importLibrary) };
    win['google'] = { maps };
    (win['__runctyGoogleMapsReady'] as () => void)();
    return maps;
  }

  afterEach(() => {
    scripts().forEach((script) => script.remove());
    delete win['google'];
    delete win['gm_authFailure'];
    delete win['__runctyGoogleMapsReady'];
    vi.useRealTimers();
  });

  it('loads the script once, in Spanish and with async loading, and resolves with google.maps', async () => {
    const loader = new GoogleMapsLoader('browser-key');

    const first = loader.load();
    const second = loader.load();
    const maps = scriptReady();

    expect(await first).toBe(win['google'] && (win['google'] as { maps: unknown }).maps);
    expect(await second).toBe(await first);
    expect(scripts()).toHaveLength(1);
    const url = new URL(scripts()[0].src);
    expect(url.origin + url.pathname).toBe('https://maps.googleapis.com/maps/api/js');
    expect(url.searchParams.get('key')).toBe('browser-key');
    expect(url.searchParams.get('loading')).toBe('async');
    expect(url.searchParams.get('language')).toBe('es');
    expect(url.searchParams.get('libraries')).toBe('maps,marker');
    expect(maps.importLibrary).toHaveBeenCalledWith('maps');
    expect(maps.importLibrary).toHaveBeenCalledWith('marker');
  });

  it('rejects when the script cannot be fetched, and can be tried again', async () => {
    const loader = new GoogleMapsLoader('browser-key');

    const failed = loader.load();
    scripts()[0].dispatchEvent(new Event('error'));

    await expect(failed).rejects.toThrow();
    expect(scripts()).toHaveLength(0);

    const retry = loader.load();
    scriptReady();
    await expect(retry).resolves.toBeDefined();
  });

  it('rejects when the script never answers', async () => {
    vi.useFakeTimers();
    const loader = new GoogleMapsLoader('browser-key', window, 5_000);

    const slow = loader.load();
    const outcome = expect(slow).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(5_000);

    await outcome;
  });

  it('tells the listeners when Google refuses the key, even if they ask afterwards', () => {
    const loader = new GoogleMapsLoader('bad-key');
    const early = vi.fn();
    loader.onAuthFailure(early);
    void loader.load().catch(() => undefined);

    (win['gm_authFailure'] as () => void)();

    expect(early).toHaveBeenCalledTimes(1);
    const late = vi.fn();
    loader.onAuthFailure(late);
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('stops notifying a listener that unsubscribed', () => {
    const loader = new GoogleMapsLoader('bad-key');
    const listener = vi.fn();
    loader.onAuthFailure(listener)();
    void loader.load().catch(() => undefined);

    (win['gm_authFailure'] as () => void)();

    expect(listener).not.toHaveBeenCalled();
  });
});
