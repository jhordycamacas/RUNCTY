import { SETTING_FIELDS, SettingField } from './settings-fields';
import { SettingKey, SystemSettings } from '../../../core/settings/system-settings';

/** The form works with text, so an empty or malformed number can be reported instead of lost. */
export type SettingsForm = Record<SettingKey, string>;
export type SettingsErrors = Partial<Record<SettingKey, string>>;

export type SettingsFormResult =
  | { settings: SystemSettings; errors?: undefined }
  | { settings?: undefined; errors: SettingsErrors };

const INTEGER = /^\d+$/;
const DECIMAL = /^\d+([.,]\d+)?$/;
const COUNTRY = /^[A-Z]{2}$/;

const KEYS = [...SETTING_FIELDS.keys()];

const roundTo = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const shown = (value: number): string => String(value).replace('.', ',');

/** The text a field shows for a stored value (the tolerance is shown as a percentage). */
const toText = (field: SettingField, value: number | string): string =>
  typeof value === 'string' ? value : String(roundTo(value * (field.scale ?? 1), 4));

export function toSettingsForm(settings: SystemSettings): SettingsForm {
  return Object.fromEntries(
    KEYS.map((key) => [key, toText(SETTING_FIELDS.get(key) as SettingField, settings[key])]),
  ) as SettingsForm;
}

/** The Spanish message of a reason the API (or the client rules) gives for one field. */
export function reasonMessage(key: SettingKey, reason: string): string {
  const field = SETTING_FIELDS.get(key);
  switch (reason) {
    case 'required':
      return 'Ingresa un valor.';
    case 'invalid':
      if (field?.kind === 'integer') return 'Ingresa un número entero, sin decimales.';
      if (field?.kind === 'decimal') return 'Ingresa un número, por ejemplo 0,5.';
      return 'El valor no es válido.';
    case 'out-of-range':
      return field?.min !== undefined && field.max !== undefined
        ? `Debe estar entre ${shown(field.min)} y ${shown(field.max)}.`
        : 'El valor está fuera del rango permitido.';
    case 'invalid-time-zone':
      return 'No es una zona horaria válida. Ejemplo: America/Guayaquil.';
    case 'invalid-country-code':
      return 'Usa dos letras mayúsculas, por ejemplo EC.';
    case 'must-not-be-below-previous':
      return key === 'penaltyHigh'
        ? 'No puede ser menor que la penalización media.'
        : 'No puede ser menor que la penalización baja.';
    case 'must-be-below-high':
      return 'Debe ser menor que el umbral del nivel Alto.';
    case 'must-exceed-min':
      return key === 'distanceMaxKm'
        ? 'Debe ser mayor que la distancia mínima.'
        : 'Debe ser mayor que el ritmo mínimo.';
    default:
      return 'El valor no es válido.';
  }
}

/** The per-field reasons of a rejected `PUT /settings`, as messages for the fields the form has. */
export function serverErrors(fields: Readonly<Record<string, string>>): SettingsErrors {
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([key]) => SETTING_FIELDS.has(key as SettingKey))
      .map(([key, reason]) => [key, reasonMessage(key as SettingKey, reason)]),
  ) as SettingsErrors;
}

type Parsed = { value: string | number; reason?: undefined } | { value?: undefined; reason: string };

function parseField(field: SettingField, text: string): Parsed {
  const raw = text.trim();
  if (!raw) return { reason: 'required' };

  if (field.kind === 'text') {
    if (field.key !== 'countryCode') return { value: raw };
    const code = raw.toUpperCase();
    return COUNTRY.test(code) ? { value: code } : { reason: 'invalid-country-code' };
  }

  if (!(field.kind === 'integer' ? INTEGER : DECIMAL).test(raw)) return { reason: 'invalid' };
  const number = Number(raw.replace(',', '.'));
  if (number < (field.min ?? -Infinity) || number > (field.max ?? Infinity)) {
    return { reason: 'out-of-range' };
  }
  return { value: roundTo(number / (field.scale ?? 1), 6) };
}

/** Pairs where the second value must not be below (or must exceed) the first one. */
const ORDER_RULES: readonly { first: SettingKey; second: SettingKey; reason: string; strict: boolean }[] = [
  { first: 'penaltyLow', second: 'penaltyMedium', reason: 'must-not-be-below-previous', strict: false },
  { first: 'penaltyMedium', second: 'penaltyHigh', reason: 'must-not-be-below-previous', strict: false },
  { first: 'paceMinSecPerKm', second: 'paceMaxSecPerKm', reason: 'must-exceed-min', strict: true },
  { first: 'distanceMinKm', second: 'distanceMaxKm', reason: 'must-exceed-min', strict: true },
];

/** Validates the form with the same bounds and rules as the API and builds the settings to send. */
export function parseSettingsForm(form: SettingsForm): SettingsFormResult {
  const values: Record<string, string | number> = {};
  const errors: SettingsErrors = {};

  for (const key of KEYS) {
    const parsed = parseField(SETTING_FIELDS.get(key) as SettingField, form[key]);
    if (parsed.reason === undefined) values[key] = parsed.value;
    else errors[key] = reasonMessage(key, parsed.reason);
  }

  const number = (key: SettingKey) => values[key] as number | undefined;
  for (const { first, second, reason, strict } of ORDER_RULES) {
    const [low, high] = [number(first), number(second)];
    if (low !== undefined && high !== undefined && (strict ? high <= low : high < low)) {
      errors[second] = reasonMessage(second, reason);
    }
  }
  const [thresholdHigh, thresholdMedium] = [number('thresholdHigh'), number('thresholdMedium')];
  if (thresholdHigh !== undefined && thresholdMedium !== undefined && thresholdMedium >= thresholdHigh) {
    errors.thresholdMedium = reasonMessage('thresholdMedium', 'must-be-below-high');
  }

  if (Object.keys(errors).length > 0) return { errors };
  return { settings: values as unknown as SystemSettings };
}

/** The parameters whose value differs, which is all `PUT /settings` needs. */
export function changedSettings(
  current: SystemSettings,
  next: SystemSettings,
): Partial<SystemSettings> {
  return Object.fromEntries(KEYS.filter((key) => current[key] !== next[key]).map((key) => [key, next[key]]));
}

/** Where the safety levels start with the thresholds typed; null while they are not valid. */
export function levelsReadout(form: SettingsForm): string | null {
  const high = parseField(SETTING_FIELDS.get('thresholdHigh') as SettingField, form.thresholdHigh);
  const medium = parseField(SETTING_FIELDS.get('thresholdMedium') as SettingField, form.thresholdMedium);
  if (typeof high.value !== 'number' || typeof medium.value !== 'number') return null;
  if (medium.value >= high.value) return null;
  return `Alto desde ${high.value}, Medio desde ${medium.value}, Bajo por debajo de ${medium.value}`;
}
