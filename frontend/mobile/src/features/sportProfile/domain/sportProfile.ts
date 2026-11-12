import { z } from 'zod';

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

/** Stored entity at `users/{uid}/private/sportProfile` (mirrors firestore.rules). */
export const sportProfileSchema = z.object({
  level: z.enum(SPORT_LEVELS),
  goals: z.array(z.enum(SPORT_GOALS)).min(1).max(SPORT_GOALS.length),
  usualPaceSecPerKm: z.number().min(PACE_RANGE_SEC.min).max(PACE_RANGE_SEC.max),
  preferredDistanceKm: z.number().min(DISTANCE_RANGE_KM.min).max(DISTANCE_RANGE_KM.max),
});

export type PerfilDeportivo = z.output<typeof sportProfileSchema>;

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

const isLevel = (v: string): v is SportLevel => (SPORT_LEVELS as readonly string[]).includes(v);
const isGoal = (v: string): v is SportGoal => (SPORT_GOALS as readonly string[]).includes(v);

/** Form values (strings) validated and converted into the stored entity. */
export const sportProfileFormSchema = z
  .object({
    level: z.string().refine(isLevel, 'Selecciona tu nivel.'),
    goals: z
      .array(z.string())
      .min(1, 'Elige al menos un objetivo.')
      .refine((goals) => goals.every(isGoal), 'Hay un objetivo no válido.'),
    pace: z
      .string()
      .trim()
      .regex(PACE_PATTERN, 'Usa el formato min:seg, por ejemplo 6:30.')
      .refine((v) => {
        const sec = parsePace(v) ?? 0;
        return sec >= PACE_RANGE_SEC.min && sec <= PACE_RANGE_SEC.max;
      }, `El ritmo debe estar entre ${formatPace(PACE_RANGE_SEC.min)} y ${formatPace(PACE_RANGE_SEC.max)} min/km.`),
    distance: z
      .string()
      .trim()
      .regex(DISTANCE_PATTERN, 'Ingresa un número, por ejemplo 10.')
      .refine((v) => {
        const km = parseDistance(v);
        return km >= DISTANCE_RANGE_KM.min && km <= DISTANCE_RANGE_KM.max;
      }, `La distancia debe estar entre ${DISTANCE_RANGE_KM.min} y ${DISTANCE_RANGE_KM.max} km.`),
  })
  .transform(
    (v): PerfilDeportivo => ({
      level: v.level as SportLevel,
      goals: v.goals.filter(isGoal),
      usualPaceSecPerKm: parsePace(v.pace) ?? 0,
      preferredDistanceKm: parseDistance(v.distance),
    }),
  );

export type SportProfileFormValues = z.input<typeof sportProfileFormSchema>;

export const EMPTY_SPORT_PROFILE_FORM: SportProfileFormValues = { level: '', goals: [], pace: '', distance: '' };

export function toSportProfileForm(profile: PerfilDeportivo): SportProfileFormValues {
  return {
    level: profile.level,
    goals: [...profile.goals],
    pace: formatPace(profile.usualPaceSecPerKm),
    distance: String(profile.preferredDistanceKm),
  };
}

export interface SportProfileRepository {
  get(uid: string): Promise<PerfilDeportivo | null>;
  /** Creates or replaces the profile (RF-01-9, RF-01-11). */
  save(uid: string, profile: PerfilDeportivo): Promise<void>;
  /** RF-01-12. Does not affect the account. */
  remove(uid: string): Promise<void>;
}
