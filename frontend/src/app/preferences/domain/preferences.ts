/** Only Spanish for now: the interface is Spanish-only. */
export const LANGUAGES = ['es'] as const;

export const FONT_SCALES = ['small', 'normal', 'large', 'xlarge'] as const;
export type FontScale = (typeof FONT_SCALES)[number];

export const APPEARANCES = ['system', 'light', 'dark'] as const;
export type Appearance = (typeof APPEARANCES)[number];

export const UNIT_SYSTEMS = ['metric', 'imperial'] as const;
export type UnitSystem = (typeof UNIT_SYSTEMS)[number];

export const LOCATION_PRIVACY_OPTIONS = ['trustedContactsDuringSession', 'off'] as const;
export type LocationPrivacy = (typeof LOCATION_PRIVACY_OPTIONS)[number];

const FONT_SCALE_MULTIPLIERS: Record<FontScale, number> = {
  small: 0.9,
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
};

/** Multiplier applied to the root font size, so every size in rem follows it. */
export function fontScaleMultiplier(scale: FontScale): number {
  return FONT_SCALE_MULTIPLIERS[scale];
}

export interface NotificationPreferences {
  enabled: boolean;
  safetyAlerts: boolean;
  events: boolean;
}

/** `users/{uid}/private/preferences` as the API answers it. */
export interface Preferences {
  language: (typeof LANGUAGES)[number];
  fontScale: FontScale;
  appearance: Appearance;
  units: UnitSystem;
  notifications: NotificationPreferences;
  locationPrivacy: LocationPrivacy;
}

/** Single source of the defaults: used when the user never saved any, and after a reset. */
export function defaultPreferences(): Preferences {
  return {
    language: 'es',
    fontScale: 'normal',
    appearance: 'system',
    units: 'metric',
    notifications: { enabled: true, safetyAlerts: true, events: true },
    locationPrivacy: 'trustedContactsDuringSession',
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const pickChoice = <T extends string>(choices: readonly T[], value: unknown, fallback: T): T =>
  typeof value === 'string' && (choices as readonly string[]).includes(value)
    ? (value as T)
    : fallback;

const pickFlag = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

/**
 * Tolerant read of a stored (or cached) document: every missing or invalid field falls back to
 * its default and unknown keys are dropped.
 */
export function parsePreferences(raw: unknown): Preferences {
  const defaults = defaultPreferences();
  const data = isRecord(raw) ? raw : {};
  const notifications = isRecord(data['notifications']) ? data['notifications'] : {};

  return {
    language: pickChoice(LANGUAGES, data['language'], defaults.language),
    fontScale: pickChoice(FONT_SCALES, data['fontScale'], defaults.fontScale),
    appearance: pickChoice(APPEARANCES, data['appearance'], defaults.appearance),
    units: pickChoice(UNIT_SYSTEMS, data['units'], defaults.units),
    notifications: {
      enabled: pickFlag(notifications['enabled'], defaults.notifications.enabled),
      safetyAlerts: pickFlag(notifications['safetyAlerts'], defaults.notifications.safetyAlerts),
      events: pickFlag(notifications['events'], defaults.notifications.events),
    },
    locationPrivacy: pickChoice(
      LOCATION_PRIVACY_OPTIONS,
      data['locationPrivacy'],
      defaults.locationPrivacy,
    ),
  };
}

const hasExactKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).length === keys.length && keys.every((key) => key in value);

const isChoice = (choices: readonly string[], value: unknown) =>
  typeof value === 'string' && choices.includes(value);

/** Strict check used before saving: the document must be complete, valid and have no extra keys. */
export function isValidPreferences(value: unknown): value is Preferences {
  if (!isRecord(value) || !isRecord(value['notifications'])) return false;
  const notifications = value['notifications'];
  return (
    hasExactKeys(value, [
      'language',
      'fontScale',
      'appearance',
      'units',
      'notifications',
      'locationPrivacy',
    ]) &&
    hasExactKeys(notifications, ['enabled', 'safetyAlerts', 'events']) &&
    isChoice(LANGUAGES, value['language']) &&
    isChoice(FONT_SCALES, value['fontScale']) &&
    isChoice(APPEARANCES, value['appearance']) &&
    isChoice(UNIT_SYSTEMS, value['units']) &&
    isChoice(LOCATION_PRIVACY_OPTIONS, value['locationPrivacy']) &&
    Object.values(notifications).every((flag) => typeof flag === 'boolean')
  );
}

export const FONT_SCALE_LABELS: Record<FontScale, string> = {
  small: 'Pequeño',
  normal: 'Normal',
  large: 'Grande',
  xlarge: 'Muy grande',
};

export const APPEARANCE_LABELS: Record<Appearance, string> = {
  system: 'Según el sistema',
  light: 'Claro',
  dark: 'Oscuro',
};

export const UNIT_SYSTEM_LABELS: Record<UnitSystem, string> = {
  metric: 'Kilómetros (km)',
  imperial: 'Millas (mi)',
};

export const LOCATION_PRIVACY_LABELS: Record<LocationPrivacy, string> = {
  trustedContactsDuringSession: 'Solo mis contactos de confianza durante el entrenamiento',
  off: 'No compartir mi ubicación',
};

export abstract class PreferencesRepository {
  /** `null` when the user never saved preferences. */
  abstract get(): Promise<Preferences | null>;
  /** Creates or replaces the document (RF-01-13, RF-01-15). */
  abstract save(preferences: Preferences): Promise<Preferences>;
  /** RF-01-16: deleting the document restores the defaults. */
  abstract remove(): Promise<void>;
}

/** Device-local copy so the theme applies before the API answers. Keyed by uid. */
export abstract class PreferencesCache {
  abstract read(uid: string): Preferences | null;
  abstract write(uid: string, preferences: Preferences): void;
  abstract clear(uid: string): void;
}

/** Makes appearance and font size visible: the part of the preferences that changes the screen. */
export abstract class PreferencesDisplay {
  abstract apply(preferences: Preferences): void;
}
