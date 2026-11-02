import type { LatLng, SafetyLevel, Severity } from './route';

/** Same limits as functions/src/routes/domain/inputs.ts. */
export const MIN_POINTS = 2;
export const MAX_POINTS = 500;
export const MAX_SEGMENT_NAME = 80;

export interface SegmentSlotSafety {
  level: SafetyLevel;
  score: number;
  factors: { type: string; severity: Severity; description: string }[];
}

/** `routes/{routeId}/segments/{id}`; `lengthM` and `safety` are computed by the backend. */
export interface Segment {
  id: string;
  name: string;
  order: number;
  coordinates: LatLng[];
  lengthM: number;
  safety: Record<string, SegmentSlotSafety>;
}

/** Payload of createSegment / updateSegment (plus routeId and segmentId). */
export interface SegmentInput {
  name: string;
  coordinates: LatLng[];
  /** 0-based target position; omitted keeps the position (or appends). */
  order?: number;
}

export interface SegmentFormValues {
  name: string;
  /** One "lat, lng" pair per line. */
  coordinates: string;
  /** 1-based position typed by the admin; empty keeps / appends. */
  position: string;
}

export type SegmentFormErrors = Partial<Record<keyof SegmentFormValues, string>>;

export const emptySegmentForm = (): SegmentFormValues => ({ name: '', coordinates: '', position: '' });

export function segmentToForm(segment: Pick<Segment, 'name' | 'order' | 'coordinates'>): SegmentFormValues {
  return {
    name: segment.name,
    coordinates: coordinatesToText(segment.coordinates),
    position: String(segment.order + 1),
  };
}

export const coordinatesToText = (points: readonly LatLng[]): string =>
  points.map((p) => `${p.lat}, ${p.lng}`).join('\n');

const toNumber = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text.trim()));

/** "lat, lng", "lat lng" or "lat; lng" (the latter allows decimal commas). */
function parseLine(line: string): LatLng | null {
  const parts = line.includes(';')
    ? line.split(';').map((p) => p.replace(',', '.'))
    : line.split(/[\s,]+/).filter((p) => p !== '');
  if (parts.length !== 2) return null;
  const [lat, lng] = parts.map(toNumber);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function parseCoordinatesText(text: string): { ok: true; points: LatLng[] } | { ok: false; error: string } {
  const points: LatLng[] = [];
  const lines = text.split(/\r?\n/);
  for (const [index, raw] of lines.entries()) {
    const line = raw.trim();
    if (line === '') continue;
    const point = parseLine(line);
    if (!point) {
      return {
        ok: false,
        error: `Línea ${index + 1}: escribe "latitud, longitud" (latitud entre -90 y 90, longitud entre -180 y 180).`,
      };
    }
    points.push(point);
  }
  if (points.length < MIN_POINTS) return { ok: false, error: `Ingresa al menos ${MIN_POINTS} puntos, uno por línea.` };
  if (points.length > MAX_POINTS) return { ok: false, error: `Máximo ${MAX_POINTS} puntos por tramo.` };
  return { ok: true, points };
}

export function parseSegmentForm(
  values: SegmentFormValues,
): { ok: true; value: SegmentInput } | { ok: false; errors: SegmentFormErrors } {
  const errors: SegmentFormErrors = {};
  const name = values.name.trim();
  if (name.length === 0) errors.name = 'El nombre es obligatorio.';
  else if (name.length > MAX_SEGMENT_NAME) errors.name = `Máximo ${MAX_SEGMENT_NAME} caracteres.`;

  const coordinates = parseCoordinatesText(values.coordinates);
  if (!coordinates.ok) errors.coordinates = coordinates.error;

  const position = values.position.trim();
  const order = position === '' ? undefined : Number(position) - 1;
  if (order !== undefined && (!Number.isInteger(order) || order < 0)) {
    errors.position = 'Debe ser un número entero desde 1.';
  }

  if (Object.keys(errors).length > 0 || !coordinates.ok) return { ok: false, errors };
  return { ok: true, value: { name, coordinates: coordinates.points, ...(order === undefined ? {} : { order }) } };
}
