import { MapLine, MapMarker, MapTone } from '../../shared/map/map-renderer';
import { LatLng, SafetyLevel } from '../domain/route';

/** A segment as the map draws it: its points in order and, if rated, its level. */
export interface MappedSegment {
  coordinates: readonly LatLng[];
  level: SafetyLevel | null;
}

const LEVEL_TONES: Record<SafetyLevel, MapTone> = {
  high: 'safe',
  medium: 'caution',
  low: 'danger',
};

/**
 * The route on the map: one line per segment, colored by its safety level (neon when unrated),
 * plus the start and end markers at the first and last point of the whole route.
 */
export function routeMapScene(segments: readonly MappedSegment[]): {
  lines: MapLine[];
  markers: MapMarker[];
} {
  const drawn = segments.filter((segment) => segment.coordinates.length > 0);
  const lines = drawn.map(
    (segment): MapLine => ({
      points: segment.coordinates,
      tone: segment.level ? LEVEL_TONES[segment.level] : 'route',
    }),
  );
  const points = drawn.flatMap((segment) => segment.coordinates);
  const markers: MapMarker[] = [];
  if (points.length > 0) markers.push({ kind: 'start', at: points[0] });
  if (points.length > 1) markers.push({ kind: 'end', at: points[points.length - 1] });
  return { lines, markers };
}
