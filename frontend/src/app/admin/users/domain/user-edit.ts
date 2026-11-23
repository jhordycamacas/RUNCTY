import {
  FieldErrors,
  PersonalData,
  trimPersonalData,
  validatePersonalData,
} from '../../../auth/domain/personal-data';
import {
  SportProfileField,
  SportProfileForm,
  SportProfileRules,
  formatPace,
} from '../../../sport-profile/domain/sport-profile';
import { UserProfile, UserSportProfile } from './user-detail';

/** The personal data form of the admin starts with what the user has now. */
export const personalFormOf = (user: UserProfile): PersonalData => ({
  firstName: user.firstName,
  lastName: user.lastName,
  birthDate: user.birthDate,
  cityId: user.cityId,
  idNumber: user.idNumber ?? '',
});

export type PersonalEditResult =
  | { data: PersonalData; errors?: undefined }
  | { data?: undefined; errors: FieldErrors<keyof PersonalData> };

/** The same rules as the runner form, applied before anything is sent. */
export function parsePersonalEdit(
  form: PersonalData,
  today: Date = new Date(),
): PersonalEditResult {
  const errors = validatePersonalData(form, today);
  return Object.keys(errors).length > 0 ? { errors } : { data: trimPersonalData(form) };
}

const GENERIC_REASON = 'Revisa este dato.';

const REASON_MESSAGES: Record<string, string> = {
  required: 'Este dato es obligatorio.',
  'too-long': 'Es demasiado largo.',
  'out-of-range': 'Está fuera del rango permitido.',
  'invalid-choice': 'Elige una opción válida.',
};

const reasonMessage = (reason: string): string => REASON_MESSAGES[reason] ?? GENERIC_REASON;

const PERSONAL_FIELDS: readonly (keyof PersonalData)[] = [
  'firstName',
  'lastName',
  'birthDate',
  'cityId',
  'idNumber',
];

/** `error.fields` of a rejected PATCH, as messages under the form fields. */
export function personalServerErrors(
  fields: Readonly<Record<string, string>>,
): FieldErrors<keyof PersonalData> {
  const errors: FieldErrors<keyof PersonalData> = {};
  for (const name of PERSONAL_FIELDS) {
    const reason = fields[name];
    if (reason === undefined) continue;
    errors[name] =
      name === 'idNumber' && reason === 'invalid-format'
        ? 'La cédula debe tener 10 dígitos.'
        : reasonMessage(reason);
  }
  return errors;
}

/** The rules of the runner form, plus the level the user has even if the catalog deactivated it. */
export function sportRulesFor(
  rules: SportProfileRules,
  currentLevel: string | null,
): SportProfileRules {
  return currentLevel === null || currentLevel === '' || rules.levels.includes(currentLevel)
    ? rules
    : { ...rules, levels: [...rules.levels, currentLevel] };
}

/** Stored profile as form values; a goal that is no longer active is left out so the admin picks again. */
export function sportFormOf(
  sport: UserSportProfile | null,
  rules: SportProfileRules,
): SportProfileForm {
  if (sport === null) return { level: '', goals: [], pace: '', distance: '' };
  return {
    level: rules.levels.includes(sport.level) ? sport.level : '',
    goals: sport.goals.filter((goal) => rules.goals.includes(goal)),
    pace: sport.usualPaceSecPerKm === null ? '' : formatPace(sport.usualPaceSecPerKm),
    distance: sport.preferredDistanceKm === null ? '' : String(sport.preferredDistanceKm),
  };
}

const SPORT_FIELD_OF_API: Record<string, SportProfileField> = {
  level: 'level',
  goals: 'goals',
  usualPaceSecPerKm: 'pace',
  preferredDistanceKm: 'distance',
};

/** `error.fields` of a rejected PUT of the sport profile, under the form fields. */
export function sportServerErrors(
  fields: Readonly<Record<string, string>>,
): Partial<Record<SportProfileField, string>> {
  const errors: Partial<Record<SportProfileField, string>> = {};
  for (const [apiName, field] of Object.entries(SPORT_FIELD_OF_API)) {
    const reason = fields[apiName];
    if (reason !== undefined) errors[field] = reasonMessage(reason);
  }
  return errors;
}
