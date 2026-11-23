/**
 * Geometry behind the route preview drawn on the catalog cards: it fits the points of a route into
 * a box (aspect ratio kept, north up) so an inline SVG can draw its shape without map tiles.
 */
import { LatLng } from './route';

export interface PreviewBox {
  width: number;
  height: number;
  /** Free space kept around the shape, in the same units as the box. */
  padding: number;
}

export interface PreviewPoint {
  x: number;
  y: number;
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Projects the points to the box: longitudes shrink by the cosine of the mid latitude so the shape
 * is not stretched, the scale is the same on both axes, and the shape is centered in the axis with
 * room to spare. A single point (or identical points) lands in the middle.
 */
export function projectPreview(points: readonly LatLng[], box: PreviewBox): PreviewPoint[] {
  if (points.length === 0) return [];
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const lngScale = Math.cos(toRadians((minLat + maxLat) / 2));
  const spanX = (maxLng - minLng) * lngScale;
  const spanY = maxLat - minLat;

  const innerWidth = box.width - 2 * box.padding;
  const innerHeight = box.height - 2 * box.padding;
  const scale = Math.min(
    spanX > 0 ? innerWidth / spanX : Infinity,
    spanY > 0 ? innerHeight / spanY : Infinity,
  );
  // Identical points: nothing to scale, they all land in the center.
  const factor = Number.isFinite(scale) ? scale : 0;
  const offsetX = box.padding + (innerWidth - spanX * factor) / 2;
  const offsetY = box.padding + (innerHeight - spanY * factor) / 2;

  return points.map((p) => ({
    x: round(offsetX + (p.lng - minLng) * lngScale * factor),
    y: round(offsetY + (maxLat - p.lat) * factor),
  }));
}

/** SVG path of the polyline; a lone point becomes a zero-length stub so round caps draw a dot. */
export function previewPath(points: readonly PreviewPoint[]): string {
  if (points.length === 0) return '';
  const drawn = points.length === 1 ? [points[0], points[0]] : points;
  return drawn.map((p, i) => `${i === 0 ? 'M' : 'L'}${round(p.x)} ${round(p.y)}`).join('');
}
