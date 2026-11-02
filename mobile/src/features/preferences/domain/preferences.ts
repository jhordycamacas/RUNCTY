import { z } from 'zod';

/** Only Spanish for now: the interface is Spanish-only (RNF). */
export const LANGUAGES = ['es'] as const;
export type Language = (typeof LANGUAGES)[number];

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

/** Multiplier applied to every font size of the theme. */
export function fontScaleMultiplier(scale: FontScale): number {
  return FONT_SCALE_MULTIPLIERS[scale];
}

const notificationsSchema = z
  .object({
    enabled: z.boolean(),
    safetyAlerts: z.boolean(),
    events: z.boolean(),
  })
  .strict();

/** Stored entity at `users/{uid}/private/preferences` (mirrors firestore.rules). */
export const preferencesSchema = z
  .object({
    language: z.enum(LANGUAGES),
    fontScale: z.enum(FONT_SCALES),
    appearance: z.enum(APPEARANCES),
    units: z.enum(UNIT_SYSTEMS),
    notifications: notificationsSchema,
    locationPrivacy: z.enum(LOCATION_PRIVACY_OPTIONS),
  })
  .strict();

export type Preferences = z.output<typeof preferencesSchema>;
export type NotificationPreferences = Preferences['notifications'];

/** Single source of the defaults: used when the doc is missing or after a reset. */
export const DEFAULT_PREFERENCES: Readonly<Preferences> = Object.freeze({
  language: 'es',
  fontScale: 'normal',
  appearance: 'system',
  units: 'metric',
  notifications: Object.freeze({ enabled: true, safetyAlerts: true, events: true }),
  locationPrivacy: 'trustedContactsDuringSession',
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pick<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

/**
 * Tolerant read of a stored (or cached) document: every missing or invalid
 * field falls back to its default, unknown keys (e.g. `updatedAt`) are dropped.
 */
export function parsePreferences(raw: unknown): Preferences {
  const d = DEFAULT_PREFERENCES;
  const data = isRecord(raw) ? raw : {};
  const notifications = isRecord(data.notifications) ? data.notifications : {};
  const shape = preferencesSchema.shape;
  const flag = z.boolean();

  return {
    language: pick(shape.language, data.language, d.language),
    fontScale: pick(shape.fontScale, data.fontScale, d.fontScale),
    appearance: pick(shape.appearance, data.appearance, d.appearance),
    units: pick(shape.units, data.units, d.units),
    notifications: {
      enabled: pick(flag, notifications.enabled, d.notifications.enabled),
      safetyAlerts: pick(flag, notifications.safetyAlerts, d.notifications.safetyAlerts),
      events: pick(flag, notifications.events, d.notifications.events),
    },
    locationPrivacy: pick(shape.locationPrivacy, data.locationPrivacy, d.locationPrivacy),
  };
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

export interface PreferencesRepository {
  /** null when the user never saved preferences. */
  get(uid: string): Promise<Preferences | null>;
  /** Creates or replaces the doc (RF-01-13, RF-01-15). */
  save(uid: string, preferences: Preferences): Promise<void>;
  /** RF-01-16: deleting the doc restores the defaults. */
  remove(uid: string): Promise<void>;
}

/** Device-local copy so the theme applies before Firestore answers. Keyed by uid. */
export interface PreferencesCache {
  read(uid: string): Promise<Preferences | null>;
  write(uid: string, preferences: Preferences): Promise<void>;
  clear(uid: string): Promise<void>;
}
