/** Parsing shared by the route management forms, which hold every value as text. */

const DECIMAL_PATTERN = /^-?\d+([.,]\d+)?$/;
const TIME_INPUT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const SAME_DAY_MESSAGE = 'La hora de fin debe ser posterior a la de inicio (mismo día).';

/** `"-3,97"` or `"-3.97"` → -3.97; null for anything else, a blank included. */
export function parseDecimal(value: string): number | null {
  const text = value.trim();
  return DECIMAL_PATTERN.test(text) ? Number(text.replace(',', '.')) : null;
}

/** A value of a time input: `HH:MM` from 00:00 to 23:59. */
export const isTimeInput = (value: string): boolean => TIME_INPUT_PATTERN.test(value);

/** A time input shows midnight as 00:00; as an end bound the API reads it as 24:00. */
export const endFromInput = (value: string): string => (value === '00:00' ? '24:00' : value);
export const endToInput = (value: string): string => (value === '24:00' ? '00:00' : value);

/** Minutes since midnight of an `HH:MM` value (24:00 included). */
export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
