import { SAME_DAY_MESSAGE, endFromInput, endToInput, isTimeInput, minutesOf } from './form-parsing';
import { TimeSlot, TimeSlotInput } from './managed-route';

const MAX_LABEL = 40;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const INVALID_DATE = 'Elige una fecha válida.';

/** The time slot form: values of time and date inputs, blank when not set. */
export interface TimeSlotForm {
  label: string;
  startTime: string;
  endTime: string;
  validFrom: string;
  validTo: string;
}

export type TimeSlotFormField = keyof TimeSlotForm;
export type TimeSlotFormErrors = Partial<Record<TimeSlotFormField, string>>;

export const EMPTY_TIME_SLOT_FORM: TimeSlotForm = {
  label: '',
  startTime: '',
  endTime: '',
  validFrom: '',
  validTo: '',
};

export type TimeSlotFormResult =
  { input: TimeSlotInput; errors?: undefined } | { input?: undefined; errors: TimeSlotFormErrors };

/** A `YYYY-MM-DD` date that exists in the calendar. */
function isIsoDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Half-open windows, so a slot may start exactly where another one ends. */
function overlaps(startTime: string, endTime: string, slot: TimeSlot): boolean {
  return (
    minutesOf(startTime) < minutesOf(slot.endTime) && minutesOf(slot.startTime) < minutesOf(endTime)
  );
}

/**
 * Validates the form with the rules of the API, including that the slot does not overlap the
 * `others` slots of the route (leave out the slot being edited).
 */
export function parseTimeSlotForm(
  form: TimeSlotForm,
  others: readonly TimeSlot[],
): TimeSlotFormResult {
  const errors: TimeSlotFormErrors = {};
  const label = form.label.trim();
  if (label.length > MAX_LABEL) errors.label = `El nombre admite máximo ${MAX_LABEL} caracteres.`;

  const hasStart = isTimeInput(form.startTime);
  const hasEnd = isTimeInput(form.endTime);
  const startTime = form.startTime;
  const endTime = endFromInput(form.endTime);
  if (!hasStart) errors.startTime = 'Elige la hora de inicio.';
  if (!hasEnd) errors.endTime = 'Elige la hora de fin.';
  if (hasStart && hasEnd) {
    const overlapped = others.find((slot) => overlaps(startTime, endTime, slot));
    if (minutesOf(startTime) >= minutesOf(endTime)) errors.endTime = SAME_DAY_MESSAGE;
    else if (overlapped) {
      errors.startTime = `Se cruza con la franja ${slotName(overlapped)}. Ajusta las horas.`;
    }
  }

  const validFrom = form.validFrom.trim();
  const validTo = form.validTo.trim();
  if (validFrom && !isIsoDate(validFrom)) errors.validFrom = INVALID_DATE;
  if (validTo && !isIsoDate(validTo)) errors.validTo = INVALID_DATE;
  if (!errors.validFrom && !errors.validTo && validFrom && validTo && validFrom > validTo) {
    errors.validTo = 'La fecha final no puede ser anterior a la inicial.';
  }

  if (Object.keys(errors).length > 0) return { errors };
  const input: TimeSlotInput = { startTime, endTime };
  if (label) input.label = label;
  if (validFrom) input.validFrom = validFrom;
  if (validTo) input.validTo = validTo;
  return { input };
}

export function toTimeSlotForm(slot: TimeSlot): TimeSlotForm {
  return {
    label: slot.label ?? '',
    startTime: slot.startTime,
    endTime: endToInput(slot.endTime),
    validFrom: slot.validFrom ?? '',
    validTo: slot.validTo ?? '',
  };
}

/** `06:00 – 09:00`, or the whole day for a window without bounds. */
export function formatWindow(startTime: string | null, endTime: string | null): string {
  return startTime && endTime ? `${startTime} – ${endTime}` : 'Todo el día';
}

/** The window of a slot, followed by its label when it has one. */
export function slotName(slot: TimeSlot): string {
  const window = formatWindow(slot.startTime, slot.endTime);
  return slot.label ? `${window} (${slot.label})` : window;
}

const formatDate = (iso: string): string => iso.split('-').reverse().join('/');

/** The validity dates in Spanish; null when the slot applies every day. */
export function formatValidity(slot: TimeSlot): string | null {
  const { validFrom, validTo } = slot;
  if (validFrom && validTo) return `Vigente del ${formatDate(validFrom)} al ${formatDate(validTo)}`;
  if (validFrom) return `Vigente desde el ${formatDate(validFrom)}`;
  if (validTo) return `Vigente hasta el ${formatDate(validTo)}`;
  return null;
}
