import { LatLng } from './route';

/**
 * Google Maps search link for a point. A plain https link: the platform opens it in the browser or
 * in the Maps app, so the app needs neither an embedded map nor a native plugin.
 */
export function googleMapsUrl(point: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
}
