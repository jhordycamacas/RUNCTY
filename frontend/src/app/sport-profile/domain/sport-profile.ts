import { CatalogItem, activeItems } from '../../core/catalogs/catalog';
import { SystemSettings } from '../../core/settings/system-settings';

/** `users/{uid}/private/sportProfile` as the API answers it. */
export interface SportProfile {
  /** A code of the `sportLevels` catalog. */
  level: string;
  /** Codes of the `sportGoals` catalog. */
  goals: string[];
  usualPaceSecPerKm: number;
  preferredDistanceKm: number;
}

export abstract class SportProfileRepository {
  /** `null` when the user has not created one yet. */
  abstract get(): Promise<SportProfile | null>;
  /** Creates or replaces the profile (RF-01-9, RF-01-11). */
  abstract save(profile: SportProfile): Promise<SportProfile>;
  /** RF-01-12. Does not affect the account. */
  abstract remove(): Promise<void>;
}

const PACE_PATTERN = /^(\d{1,2}):([0-5]\d)$/;

/** `"6:30"` → 390 seconds per km; null when malformed. */
export function parsePace(value: string): number | null {
  const match = PACE_PATTERN.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatPace(secPerKm: number): string {
  const total = Math.round(secPerKm);
  const seconds = total % 60;
  return `${Math.floor(total / 60)}:${seconds.toString().padStart(2, '0')}`;
}

const DISTANCE_PATTERN = /^\d+([.,]\d+)?$/;

function parseDistance(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

/** What the form validates against: the options active now and the ranges the admin configured. */
export interface SportProfileRules {
  levels: readonly string[];
  goals: readonly string[];
  paceMinSecPerKm: number;
  paceMaxSecPerKm: number;
  distanceMinKm: number;
  distanceMaxKm: number;
}

export function sportProfileRules(
  levels: readonly CatalogItem[],
  goals: readonly CatalogItem[],
  settings: SystemSettings,
): SportProfileRules {
  return {
    levels: activeItems(levels).map((item) => item.code),
    goals: activeItems(goals).map((item) => item.code),
    paceMinSecPerKm: settings.paceMinSecPerKm,
    paceMaxSecPerKm: settings.paceMaxSecPerKm,
    distanceMinKm: settings.distanceMinKm,
    distanceMaxKm: settings.distanceMaxKm,
  };
}

/** The form works with text: level, goals, pace as `min:seg` and distance in km. */
export interface SportProfileForm {
  level: string;
  goals: string[];
  pace: string;
  distance: string;
}

export type SportProfileField = keyof SportProfileForm;

export const EMPTY_SPORT_PROFILE_FORM: SportProfileForm = {
  level: '',
  goals: [],
  pace: '',
  distance: '',
};

export type SportProfileResult =
  | { profile: SportProfile; errors?: undefined }
  | { profile?: undefined; errors: Partial<Record<SportProfileField, string>> };

/** Validates the form values and converts them into the profile that is sent to the API. */
export function parseSportProfileForm(
  form: SportProfileForm,
  rules: SportProfileRules,
): SportProfileResult {
  const errors: Partial<Record<SportProfileField, string>> = {};

  const levelKnown = rules.levels.includes(form.level);
  if (!levelKnown) errors.level = 'Selecciona tu nivel.';
  if (form.goals.length === 0) errors.goals = 'Elige al menos un objetivo.';
  else if (!form.goals.every((goal) => rules.goals.includes(goal))) {
    errors.goals = 'Hay un objetivo no válido.';
  }

  const pace = form.pace.trim();
  const paceSec = parsePace(pace);
  if (!PACE_PATTERN.test(pace)) errors.pace = 'Usa el formato min:seg, por ejemplo 6:30.';
  else if (paceSec === null || paceSec < rules.paceMinSecPerKm || paceSec > rules.paceMaxSecPerKm) {
    errors.pace = `El ritmo debe estar entre ${formatPace(rules.paceMinSecPerKm)} y ${formatPace(rules.paceMaxSecPerKm)} min/km.`;
  }

  const distance = form.distance.trim();
  const km = parseDistance(distance);
  if (!DISTANCE_PATTERN.test(distance)) errors.distance = 'Ingresa un número, por ejemplo 10.';
  else if (km < rules.distanceMinKm || km > rules.distanceMaxKm) {
    errors.distance = `La distancia debe estar entre ${rules.distanceMinKm} y ${rules.distanceMaxKm} km.`;
  }

  if (Object.keys(errors).length > 0 || paceSec === null) return { errors };
  return {
    profile: {
      level: form.level,
      goals: [...form.goals],
      usualPaceSecPerKm: paceSec,
      preferredDistanceKm: km,
    },
  };
}

/**
 * Stored profile as form values. A stored choice that is no longer active is left out, so the user
 * picks again instead of being stuck with an option the form cannot show.
 */
export function toSportProfileForm(
  profile: SportProfile,
  rules: SportProfileRules,
): SportProfileForm {
  return {
    level: rules.levels.includes(profile.level) ? profile.level : '',
    goals: profile.goals.filter((goal) => rules.goals.includes(goal)),
    pace: formatPace(profile.usualPaceSecPerKm),
    distance: String(profile.preferredDistanceKm),
  };
}
