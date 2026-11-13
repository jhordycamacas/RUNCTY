export const SPORT_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type SportLevel = (typeof SPORT_LEVELS)[number];

export const SPORT_LEVEL_LABELS: Record<SportLevel, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const SPORT_GOALS = ['health', 'weightLoss', 'racePrep', 'pace', 'social'] as const;
export type SportGoal = (typeof SPORT_GOALS)[number];

export const SPORT_GOAL_LABELS: Record<SportGoal, string> = {
  health: 'Salud',
  weightLoss: 'Bajar de peso',
  racePrep: 'Preparar una carrera',
  pace: 'Mejorar mi ritmo',
  social: 'Socializar',
};

const PACE_RANGE_SEC = { min: 150, max: 1200 } as const;
const DISTANCE_RANGE_KM = { min: 1, max: 50 } as const;

/** `users/{uid}/private/sportProfile` as the API answers it. */
export interface SportProfile {
  level: SportLevel;
  goals: SportGoal[];
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

const isLevel = (value: string): value is SportLevel =>
  (SPORT_LEVELS as readonly string[]).includes(value);
const isGoal = (value: string): value is SportGoal =>
  (SPORT_GOALS as readonly string[]).includes(value);

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
export function parseSportProfileForm(form: SportProfileForm): SportProfileResult {
  const errors: Partial<Record<SportProfileField, string>> = {};

  if (!isLevel(form.level)) errors.level = 'Selecciona tu nivel.';
  if (form.goals.length === 0) errors.goals = 'Elige al menos un objetivo.';
  else if (!form.goals.every(isGoal)) errors.goals = 'Hay un objetivo no válido.';

  const pace = form.pace.trim();
  const paceSec = parsePace(pace);
  if (!PACE_PATTERN.test(pace)) errors.pace = 'Usa el formato min:seg, por ejemplo 6:30.';
  else if (paceSec === null || paceSec < PACE_RANGE_SEC.min || paceSec > PACE_RANGE_SEC.max) {
    errors.pace = `El ritmo debe estar entre ${formatPace(PACE_RANGE_SEC.min)} y ${formatPace(PACE_RANGE_SEC.max)} min/km.`;
  }

  const distance = form.distance.trim();
  const km = parseDistance(distance);
  if (!DISTANCE_PATTERN.test(distance)) errors.distance = 'Ingresa un número, por ejemplo 10.';
  else if (km < DISTANCE_RANGE_KM.min || km > DISTANCE_RANGE_KM.max) {
    errors.distance = `La distancia debe estar entre ${DISTANCE_RANGE_KM.min} y ${DISTANCE_RANGE_KM.max} km.`;
  }

  if (Object.keys(errors).length > 0 || !isLevel(form.level) || paceSec === null) return { errors };
  return {
    profile: {
      level: form.level,
      goals: form.goals.filter(isGoal),
      usualPaceSecPerKm: paceSec,
      preferredDistanceKm: km,
    },
  };
}

export function toSportProfileForm(profile: SportProfile): SportProfileForm {
  return {
    level: profile.level,
    goals: [...profile.goals],
    pace: formatPace(profile.usualPaceSecPerKm),
    distance: String(profile.preferredDistanceKm),
  };
}
