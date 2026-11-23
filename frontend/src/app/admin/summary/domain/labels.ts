/** Wording of the summary that does not depend on the data. */

/** Greeting for the hour of the day (0 to 23). */
export function greeting(hour: number): string {
  if (hour < 12) return 'Buenos días';
  return hour < 19 ? 'Buenas tardes' : 'Buenas noches';
}

const WEEK_FORMAT = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

/** A Monday as "16 nov": a plain calendar day, with no timezone shift. */
export function weekLabel(weekStart: string): string {
  return WEEK_FORMAT.format(new Date(`${weekStart}T00:00:00Z`)).replace('.', '');
}
