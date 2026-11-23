import { ManagedUser, toManagedUser } from './managed-user';

/** The user of `GET /users/{uid}`: the summary plus the data of the owner's own profile. */
export interface UserProfile extends ManagedUser {
  idNumber: string | null;
  /** `null` when the API does not say. */
  emailVerified: boolean | null;
  /** ISO date or date-time; `null` when the API does not say. */
  createdAt: string | null;
}

/** The sport profile as the API sends it; a part that is missing reads as `null`. */
export interface UserSportProfile {
  /** A code of the `sportLevels` catalog. */
  level: string;
  /** Codes of the `sportGoals` catalog. */
  goals: string[];
  usualPaceSecPerKm: number | null;
  preferredDistanceKm: number | null;
}

export interface UserRating {
  /** Out of five. */
  average: number;
  count: number;
}

export interface UserDetail {
  user: UserProfile;
  /** `null` while the user has not completed the sport profile. */
  sportProfile: UserSportProfile | null;
  /** `null` while nobody has rated the user (or while the API does not send it). */
  rating: UserRating | null;
}

const MAX_RATING = 5;

const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const optionalText = (value: unknown): string | null =>
  typeof value === 'string' && value !== '' ? value : null;

const optionalNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

/** Tolerant read of a sport profile; `null` when the API sends none. */
export function toSportProfile(raw: unknown): UserSportProfile | null {
  const data = record(raw);
  if (data === null) return null;
  const goals = data['goals'];
  return {
    level: typeof data['level'] === 'string' ? data['level'] : '',
    goals: Array.isArray(goals)
      ? goals.filter((goal): goal is string => typeof goal === 'string')
      : [],
    usualPaceSecPerKm: optionalNumber(data['usualPaceSecPerKm']),
    preferredDistanceKm: optionalNumber(data['preferredDistanceKm']),
  };
}

function toRating(raw: unknown): UserRating | null {
  const data = record(raw);
  const average = optionalNumber(data?.['average']);
  const count = optionalNumber(data?.['count']);
  if (average === null || count === null || count < 1) return null;
  return { average: Math.min(Math.max(average, 0), MAX_RATING), count: Math.floor(count) };
}

/** Tolerant read of the `user` of `GET /users/{uid}` and `PATCH /users/{uid}`. */
export function toUserProfile(raw: unknown): UserProfile {
  const user = record(raw) ?? {};
  return {
    ...toManagedUser(user),
    idNumber: optionalText(user['idNumber']),
    emailVerified: typeof user['emailVerified'] === 'boolean' ? user['emailVerified'] : null,
    createdAt: optionalText(user['createdAt']),
  };
}

/** Tolerant read of `GET /users/{uid}`. */
export function toUserDetail(raw: unknown): UserDetail {
  const data = record(raw) ?? {};
  return {
    user: toUserProfile(data['user']),
    sportProfile: toSportProfile(data['sportProfile']),
    rating: toRating(data['rating']),
  };
}

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const DATE_START = /^(\d{4})-(\d{2})-(\d{2})/;

/** `1995-04-23` (or a date-time starting with it) as "23 de abril de 1995". */
export function displayDate(value: string): string {
  const match = DATE_START.exec(value);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return match && month ? `${Number(match[3])} de ${month} de ${match[1]}` : value;
}
