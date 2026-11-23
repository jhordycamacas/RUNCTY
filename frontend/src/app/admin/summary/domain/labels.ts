import { SignupRange } from './summary';

/** Wording of the summary that does not depend on the data. */

/** Greeting for the hour of the day (0 to 23). */
export function greeting(hour: number): string {
  if (hour < 12) return 'Buenos días';
  return hour < 19 ? 'Buenas tardes' : 'Buenas noches';
}

/** The ranges of the acquisition chart, in the order of its buttons. */
export const SIGNUP_RANGES: readonly { id: SignupRange; label: string }[] = [
  { id: 'daily', label: '30 días' },
  { id: 'weekly', label: '12 semanas' },
  { id: 'monthly', label: '12 meses' },
];

// Bucket starts are plain calendar days of the system time zone: format them in UTC so the
// browser time zone never shifts them.
const DAY = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const WEEKDAY_AND_DAY = new Intl.DateTimeFormat('es', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const MONTH = new Intl.DateTimeFormat('es', { month: 'short', timeZone: 'UTC' });
const MONTH_AND_YEAR = new Intl.DateTimeFormat('es', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const LOCAL_DAY = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });
const LOCAL_DAY_AND_YEAR = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const noDot = (text: string): string => text.replace('.', '');
const utcDay = (start: string): Date => new Date(`${start}T00:00:00Z`);

/** The short label under a column: "17 nov" (a day or the Monday of a week) or "nov". */
export function bucketLabel(range: SignupRange, start: string): string {
  const day = utcDay(start);
  if (range !== 'monthly') return noDot(DAY.format(day));
  const month = noDot(MONTH.format(day));
  return start.endsWith('-01-01') ? `${month} ${start.slice(0, 4)}` : month;
}

/** The title of a column in the tooltip: "mar, 17 nov", "Semana del 16 nov" or "noviembre de 2026". */
export function bucketTitle(range: SignupRange, start: string): string {
  const day = utcDay(start);
  if (range === 'daily') return noDot(WEEKDAY_AND_DAY.format(day));
  if (range === 'weekly') return `Semana del ${noDot(DAY.format(day))}`;
  return MONTH_AND_YEAR.format(day);
}

const MS_PER_DAY = 86_400_000;
const calendarDay = (moment: Date): number =>
  Date.UTC(moment.getFullYear(), moment.getMonth(), moment.getDate());

/** "hoy", "ayer", "hace 3 días" up to a week, then "23 nov" (with the year when it differs). */
export function recentDate(iso: string, now: Date): string {
  const moment = new Date(iso);
  const days = Math.round((calendarDay(now) - calendarDay(moment)) / MS_PER_DAY);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  const sameYear = moment.getFullYear() === now.getFullYear();
  return noDot((sameYear ? LOCAL_DAY : LOCAL_DAY_AND_YEAR).format(moment));
}
