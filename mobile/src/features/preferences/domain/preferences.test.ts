import {
  DEFAULT_PREFERENCES,
  fontScaleMultiplier,
  parsePreferences,
  preferencesSchema,
  type Preferences,
} from './preferences';

const custom: Preferences = {
  language: 'es',
  fontScale: 'large',
  appearance: 'dark',
  units: 'imperial',
  notifications: { enabled: true, safetyAlerts: false, events: true },
  locationPrivacy: 'off',
};

describe('preferencesSchema', () => {
  it('accepts a complete valid document', () => {
    expect(preferencesSchema.safeParse(custom).success).toBe(true);
    expect(preferencesSchema.safeParse(DEFAULT_PREFERENCES).success).toBe(true);
  });

  it.each([
    ['language', { language: 'en' }],
    ['fontScale', { fontScale: 'huge' }],
    ['appearance', { appearance: 'sepia' }],
    ['units', { units: 'nautical' }],
    ['locationPrivacy', { locationPrivacy: 'everyone' }],
    ['notifications', { notifications: { enabled: 'yes', safetyAlerts: true, events: true } }],
  ])('rejects an invalid %s', (_field, override) => {
    expect(preferencesSchema.safeParse({ ...custom, ...override }).success).toBe(false);
  });

  it('rejects unknown keys', () => {
    expect(preferencesSchema.safeParse({ ...custom, darkMode: true }).success).toBe(false);
  });
});

describe('DEFAULT_PREFERENCES', () => {
  it('uses Spanish, normal text, system appearance, metric units and trusted-contacts sharing', () => {
    expect(DEFAULT_PREFERENCES).toEqual({
      language: 'es',
      fontScale: 'normal',
      appearance: 'system',
      units: 'metric',
      notifications: { enabled: true, safetyAlerts: true, events: true },
      locationPrivacy: 'trustedContactsDuringSession',
    });
  });
});

describe('parsePreferences (merge with defaults)', () => {
  it('returns the defaults for a missing or non-object document', () => {
    expect(parsePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('dark')).toEqual(DEFAULT_PREFERENCES);
  });

  it('keeps a complete valid document and drops extra keys such as updatedAt', () => {
    expect(parsePreferences({ ...custom, updatedAt: { seconds: 1 } })).toEqual(custom);
  });

  it('fills missing fields from the defaults', () => {
    expect(parsePreferences({ appearance: 'dark', notifications: { events: false } })).toEqual({
      ...DEFAULT_PREFERENCES,
      appearance: 'dark',
      notifications: { ...DEFAULT_PREFERENCES.notifications, events: false },
    });
  });

  it('replaces invalid fields with their defaults', () => {
    expect(parsePreferences({ ...custom, fontScale: 'huge', units: 3 })).toEqual({
      ...custom,
      fontScale: DEFAULT_PREFERENCES.fontScale,
      units: DEFAULT_PREFERENCES.units,
    });
  });

  it('returns a new object that does not share the defaults', () => {
    const parsed = parsePreferences(null);
    parsed.notifications.enabled = false;
    expect(DEFAULT_PREFERENCES.notifications.enabled).toBe(true);
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
