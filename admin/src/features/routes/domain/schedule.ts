import type { Severity } from './route';

/**
 * RF-07: time slots ("franjas") and risk factors per segment. Times are
 * "HH:MM" within one day; "24:00" is only valid as an end bound. Windows are
 * half-open, so 06:00–09:00 and 09:00–12:00 do not overlap (same rules as
 * functions/src/routes/domain/time.ts and inputs.ts).
 */
export const RISK_FACTOR_TYPES = [
  'poor_lighting',
  'traffic',
  'isolated_area',
  'harassment',
  'uneven_terrain',
  'flood_risk',
  'other',
] as const;
export const SEVERITIES = ['low', 'medium', 'high'] as const satisfies readonly Severity[];

export type RiskFactorType = (typeof RISK_FACTOR_TYPES)[number];

export const MAX_SLOT_LABEL = 40;
export const MAX_FACTOR_DESCRIPTION = 200;

const FACTOR_TYPE_LABELS: Record<RiskFactorType, string> = {
  poor_lighting: 'Iluminación deficiente',
  traffic: 'Tráfico',
  isolated_area: 'Zona solitaria',
  harassment: 'Acoso',
  uneven_terrain: 'Terreno irregular',
  flood_risk: 'Riesgo de inundación',
  other: 'Otro',
};

const SEVERITY_LABELS: Record<Severity, string> = { low: 'Baja', medium: 'Media', high: 'Alta' };

/** Unknown types (added later in the backend) read as "Otro". */
export const factorTypeLabel = (type: string): string =>
  (RISK_FACTOR_TYPES as readonly string[]).includes(type) ? FACTOR_TYPE_LABELS[type as RiskFactorType] : 'Otro';

export const severityLabel = (severity: Severity): string => SEVERITY_LABELS[severity];

export function formatWindow(startTime: string | undefined, endTime: string | undefined): string {
  return startTime && endTime ? `${startTime}–${endTime}` : 'Todo el día';
}

const TIME_PATTERN = /^([01]\d|2[0-4]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MINUTES = 24 * 60;

/** Minutes since midnight for "HH:MM" (00:00–24:00), or null. */
function parseTime(value: string): number | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes > DAY_MINUTES ? null : minutes;
}

function isIsoDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

interface WindowErrors {
  startTime?: string;
  endTime?: string;
}

/** Validates a required "HH:MM" window; start < 24:00, end ≤ 24:00, start < end. */
function checkWindow(startTime: string, endTime: string): WindowErrors {
  const errors: WindowErrors = {};
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  if (start === null || start >= DAY_MINUTES) errors.startTime = 'Usa el formato HH:MM (00:00 a 23:59).';
  if (end === null) errors.endTime = 'Usa el formato HH:MM (00:00 a 24:00).';
  if (start !== null && end !== null && !errors.startTime && start >= end) {
    errors.endTime = 'La hora de fin debe ser después de la hora de inicio (mismo día).';
  }
  return errors;
}

// ---------- Time slots ----------

/** `routes/{routeId}/timeSlots/{id}`. */
export interface TimeSlot {
  id: string;
  label?: string;
  startTime: string;
  endTime: string;
  validFrom?: string;
  validTo?: string;
}

export type TimeSlotInput = Omit<TimeSlot, 'id'>;

export interface TimeSlotFormValues {
  label: string;
  startTime: string;
  endTime: string;
  validFrom: string;
  validTo: string;
}

export type TimeSlotFormErrors = Partial<Record<keyof TimeSlotFormValues, string>>;

export const emptyTimeSlotForm = (): TimeSlotFormValues => ({ label: '', startTime: '', endTime: '', validFrom: '', validTo: '' });

export const timeSlotToForm = (slot: TimeSlot): TimeSlotFormValues => ({
  label: slot.label ?? '',
  startTime: slot.startTime,
  endTime: slot.endTime,
  validFrom: slot.validFrom ?? '',
  validTo: slot.validTo ?? '',
});

export function parseTimeSlotForm(
  values: TimeSlotFormValues,
): { ok: true; value: TimeSlotInput } | { ok: false; errors: TimeSlotFormErrors } {
  const label = values.label.trim();
  const startTime = values.startTime.trim();
  const endTime = values.endTime.trim();
  const validFrom = values.validFrom.trim();
  const validTo = values.validTo.trim();

  const errors: TimeSlotFormErrors = { ...checkWindow(startTime, endTime) };
  if (label.length > MAX_SLOT_LABEL) errors.label = `Máximo ${MAX_SLOT_LABEL} caracteres.`;
  const dateError = 'Usa una fecha válida con el formato AAAA-MM-DD.';
  if (validFrom !== '' && !isIsoDate(validFrom)) errors.validFrom = dateError;
  if (validTo !== '' && !isIsoDate(validTo)) errors.validTo = dateError;
  if (!errors.validFrom && !errors.validTo && validFrom !== '' && validTo !== '' && validFrom > validTo) {
    errors.validTo = 'La fecha final no puede ser anterior a la inicial.';
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      ...(label ? { label } : {}),
      startTime,
      endTime,
      ...(validFrom ? { validFrom } : {}),
      ...(validTo ? { validTo } : {}),
    },
  };
}

const toWindow = (startTime: string, endTime: string) => ({
  start: parseTime(startTime) ?? 0,
  end: parseTime(endTime) ?? DAY_MINUTES,
});

/** Client-side copy of the `time-slot-overlap` check, to name the clashing slot. */
export function findOverlappingSlot<T extends Pick<TimeSlot, 'id' | 'startTime' | 'endTime'>>(
  slots: readonly T[],
  candidate: Pick<TimeSlot, 'startTime' | 'endTime'>,
  ignoreId?: string,
): T | undefined {
  const window = toWindow(candidate.startTime, candidate.endTime);
  return slots.find((slot) => {
    if (slot.id === ignoreId) return false;
    const other = toWindow(slot.startTime, slot.endTime);
    return window.start < other.end && other.start < window.end;
  });
}

// ---------- Risk factors ----------

/** `routes/{routeId}/segments/{segmentId}/riskFactors/{id}`. */
export interface RiskFactor {
  id: string;
  type: string;
  severity: Severity;
  description: string;
  startTime?: string;
  endTime?: string;
}

export interface RiskFactorInput {
  type: RiskFactorType;
  severity: Severity;
  description: string;
  startTime?: string;
  endTime?: string;
}

export interface RiskFactorFormValues {
  type: RiskFactorType;
  severity: Severity;
  description: string;
  startTime: string;
  endTime: string;
}

export type RiskFactorFormErrors = Partial<Record<keyof RiskFactorFormValues, string>>;

export const emptyRiskFactorForm = (): RiskFactorFormValues => ({
  type: 'poor_lighting',
  severity: 'medium',
  description: '',
  startTime: '',
  endTime: '',
});

export const riskFactorToForm = (factor: RiskFactor): RiskFactorFormValues => ({
  type: (RISK_FACTOR_TYPES as readonly string[]).includes(factor.type) ? (factor.type as RiskFactorType) : 'other',
  severity: factor.severity,
  description: factor.description,
  startTime: factor.startTime ?? '',
  endTime: factor.endTime ?? '',
});

export function parseRiskFactorForm(
  values: RiskFactorFormValues,
): { ok: true; value: RiskFactorInput } | { ok: false; errors: RiskFactorFormErrors } {
  const description = values.description.trim();
  const startTime = values.startTime.trim();
  const endTime = values.endTime.trim();
  const errors: RiskFactorFormErrors = {};

  if (!(RISK_FACTOR_TYPES as readonly string[]).includes(values.type)) errors.type = 'Elige un tipo de factor.';
  if (!(SEVERITIES as readonly string[]).includes(values.severity)) errors.severity = 'Elige una severidad.';
  if (description.length === 0) errors.description = 'La descripción es obligatoria.';
  else if (description.length > MAX_FACTOR_DESCRIPTION) errors.description = `Máximo ${MAX_FACTOR_DESCRIPTION} caracteres.`;

  const hasWindow = startTime !== '' || endTime !== '';
  if (hasWindow && (startTime === '' || endTime === '')) {
    errors[startTime === '' ? 'startTime' : 'endTime'] = 'Completa ambas horas o deja las dos vacías (todo el día).';
  } else if (hasWindow) {
    Object.assign(errors, checkWindow(startTime, endTime));
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      type: values.type,
      severity: values.severity,
      description,
      ...(hasWindow ? { startTime, endTime } : {}),
    },
  };
}
