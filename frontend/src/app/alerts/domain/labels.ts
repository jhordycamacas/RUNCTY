import { AlertSeverity, RiskZoneAlert } from './risk-zone-alert';

const ALERT_TYPE_LABELS: Record<string, string> = {
  robbery: 'Robos reportados',
  assault: 'Asaltos reportados',
  harassment: 'Acoso',
  poor_lighting: 'Iluminación deficiente',
  roadworks: 'Obras en la vía',
  flooding: 'Inundación',
  traffic: 'Tráfico intenso',
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  alta: 'Riesgo alto',
  media: 'Riesgo medio',
  baja: 'Riesgo bajo',
};

/** Kinds added later in the backend read as a generic risk zone. */
export function alertTypeLabel(type: string): string {
  return Object.prototype.hasOwnProperty.call(ALERT_TYPE_LABELS, type)
    ? ALERT_TYPE_LABELS[type]
    : 'Zona de riesgo';
}

const DATE_FORMAT = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });

const formatDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return year && month && day ? DATE_FORMAT.format(new Date(year, month - 1, day)) : iso;
};

/** "Del 20 nov al 30 nov · de 18:00 a 21:00", or the dates only when it applies all day. */
export function alertSchedule(alert: RiskZoneAlert): string {
  const period = `Del ${formatDate(alert.validFrom)} al ${formatDate(alert.validTo)}`;
  return alert.startTime && alert.endTime
    ? `${period} · de ${alert.startTime} a ${alert.endTime}`
    : `${period} · todo el día`;
}
