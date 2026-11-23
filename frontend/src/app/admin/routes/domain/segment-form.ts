import { DEFAULT_SETTINGS, SystemSettings } from '../../../core/settings/system-settings';
import { LatLng, Segment } from '../../../routes/domain/route';
import { parseDecimal } from './form-parsing';
import { SegmentInput } from './managed-route';

const MIN_POINTS = 2;
const POSITION_PATTERN = /^\d+$/;

/** The parameters the segment form validates against (Configuración). */
export type SegmentLimits = Pick<SystemSettings, 'routeNameMaxLength' | 'segmentMaxPoints'>;

/**
 * The segment form: the 1-based position in the route (blank keeps it, or appends a new
 * segment) and one "latitud, longitud" point per line.
 */
export interface SegmentForm {
  name: string;
  position: string;
  coordinates: string;
}

export type SegmentFormField = keyof SegmentForm;
export type SegmentFormErrors = Partial<Record<SegmentFormField, string>>;

export const EMPTY_SEGMENT_FORM: SegmentForm = { name: '', position: '', coordinates: '' };

export type SegmentFormResult =
  { input: SegmentInput; errors?: undefined } | { input?: undefined; errors: SegmentFormErrors };

/** "lat, lng", "lat; lng" or "lat lng", with a decimal point or comma. */
function splitPoint(line: string): string[] {
  if (line.includes(';')) return line.split(';');
  const bySpace = line.split(/,?\s+/);
  return bySpace.length === 2 ? bySpace : line.split(',');
}

function parsePoint(line: string): LatLng | null {
  const parts = splitPoint(line);
  if (parts.length !== 2) return null;
  const [lat, lng] = parts.map(parseDecimal);
  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function parseCoordinates(
  text: string,
  maxPoints: number,
): { points: LatLng[]; error?: string } {
  const points: LatLng[] = [];
  const lines = text.split('\n');
  for (const [index, raw] of lines.entries()) {
    const line = raw.trim();
    if (!line) continue;
    const point = parsePoint(line);
    if (!point) {
      return {
        points,
        error: `Línea ${index + 1}: escribe "latitud, longitud" (latitud entre -90 y 90, longitud entre -180 y 180).`,
      };
    }
    points.push(point);
  }
  if (points.length < MIN_POINTS) {
    return { points, error: `Ingresa al menos ${MIN_POINTS} puntos, uno por línea.` };
  }
  if (points.length > maxPoints) {
    return { points, error: `Un tramo admite máximo ${maxPoints} puntos.` };
  }
  return { points };
}

/** Validates the form with the limits of the API; the position becomes the 0-based `order`. */
export function parseSegmentForm(
  form: SegmentForm,
  limits: SegmentLimits = DEFAULT_SETTINGS,
): SegmentFormResult {
  const errors: SegmentFormErrors = {};
  const name = form.name.trim();
  const maxName = limits.routeNameMaxLength;
  if (!name) errors.name = 'El nombre es obligatorio.';
  else if (name.length > maxName) errors.name = `El nombre admite máximo ${maxName} caracteres.`;

  const position = form.position.trim();
  if (position && (!POSITION_PATTERN.test(position) || Number(position) < 1)) {
    errors.position = 'La posición debe ser un número entero desde 1.';
  }

  const coordinates = parseCoordinates(form.coordinates, limits.segmentMaxPoints);
  if (coordinates.error) errors.coordinates = coordinates.error;

  if (Object.keys(errors).length > 0) return { errors };
  const input: SegmentInput = { name, coordinates: coordinates.points };
  if (position) input.order = Number(position) - 1;
  return { input };
}

export function toSegmentForm(segment: Segment): SegmentForm {
  return {
    name: segment.name,
    position: String(segment.order + 1),
    coordinates: segment.coordinates.map(({ lat, lng }) => `${lat}, ${lng}`).join('\n'),
  };
}
