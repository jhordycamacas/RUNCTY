import { SEVERITY_LABELS } from '../../../routes/domain/labels';

/** Spanish labels for the keys the summary groups by; an unknown key is shown as it comes. */
const ROLE_LABELS: Record<string, string> = {
  runner: 'Corredores',
  admin: 'Administradores',
  none: 'Sin rol',
};

const APPEARANCE_LABELS: Record<string, string> = {
  system: 'Según el sistema',
  light: 'Claro',
  dark: 'Oscuro',
};

const labelFrom = (labels: Record<string, string>) => (key: string) => labels[key] ?? key;

export const roleLabel = labelFrom(ROLE_LABELS);
export const appearanceLabel = labelFrom(APPEARANCE_LABELS);
export const severityLabel = labelFrom(SEVERITY_LABELS);

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
