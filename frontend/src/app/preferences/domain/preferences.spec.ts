import {
  Preferences,
  defaultPreferences,
  fontScaleMultiplier,
  isValidPreferences,
  parsePreferences,
} from './preferences';

const custom: Preferences = {
  language: 'es',
  fontScale: 'large',
  appearance: 'dark',
  units: 'imperial',
  notifications: { enabled: true, safetyAlerts: false, events: true },
  locationPrivacy: 'off',
};

describe('isValidPreferences', () => {
  it('accepts a complete valid document', () => {
    expect(isValidPreferences(custom)).toBe(true);
    expect(isValidPreferences(defaultPreferences())).toBe(true);
  });

  it.each([
    ['language', { language: 'en' }],
    ['fontScale', { fontScale: 'huge' }],
    ['appearance', { appearance: 'sepia' }],
    ['units', { units: 'nautical' }],
    ['locationPrivacy', { locationPrivacy: 'everyone' }],
    ['notifications', { notifications: { enabled: 'yes', safetyAlerts: true, events: true } }],
  ])('rejects an invalid %s', (_field, override) => {
    expect(isValidPreferences({ ...custom, ...override })).toBe(false);
  });

  it('rejects unknown keys and missing ones', () => {
    expect(isValidPreferences({ ...custom, darkMode: true })).toBe(false);
    expect(isValidPreferences({ ...custom, notifications: { enabled: true } })).toBe(false);
    expect(isValidPreferences(null)).toBe(false);
  });
});

describe('defaultPreferences', () => {
  it('uses Spanish, normal text, light appearance, metric units and trusted-contacts sharing', () => {
    expect(defaultPreferences()).toEqual({
      language: 'es',
      fontScale: 'normal',
      appearance: 'light',
      units: 'metric',
      notifications: { enabled: true, safetyAlerts: true, events: true },
      locationPrivacy: 'trustedContactsDuringSession',
    });
  });

  it('returns a new object every time, so nobody can change the defaults', () => {
    const parsed = defaultPreferences();
    parsed.notifications.enabled = false;

    expect(defaultPreferences().notifications.enabled).toBe(true);
  });
});

describe('parsePreferences (merge with defaults)', () => {
  it('returns the defaults for a missing or non-object document', () => {
    expect(parsePreferences(undefined)).toEqual(defaultPreferences());
    expect(parsePreferences(null)).toEqual(defaultPreferences());
    expect(parsePreferences('dark')).toEqual(defaultPreferences());
  });

  it('keeps a complete valid document and drops extra keys', () => {
    expect(parsePreferences({ ...custom, updatedAt: { seconds: 1 } })).toEqual(custom);
  });

  it('fills missing fields from the defaults', () => {
    expect(parsePreferences({ appearance: 'dark', notifications: { events: false } })).toEqual({
      ...defaultPreferences(),
      appearance: 'dark',
      notifications: { ...defaultPreferences().notifications, events: false },
    });
  });

  it('replaces invalid fields with their defaults', () => {
    expect(parsePreferences({ ...custom, fontScale: 'huge', units: 3 })).toEqual({
      ...custom,
      fontScale: defaultPreferences().fontScale,
      units: defaultPreferences().units,
    });
  });
});

describe('fontScaleMultiplier', () => {
  it.each([
    ['small', 0.9],
    ['normal', 1],
    ['large', 1.15],
    ['xlarge', 1.3],
  ] as const)('maps %s to %d', (scale, multiplier) => {
    expect(fontScaleMultiplier(scale)).toBe(multiplier);
  });
});
