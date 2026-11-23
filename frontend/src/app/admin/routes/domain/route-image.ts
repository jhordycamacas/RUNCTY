import { ImageCodec } from '../../../shared/images/image-codec';
import { resizeToWidthJpeg } from '../../../shared/images/resize-to-width-jpeg';

/**
 * The custom image of a route: the full picture, stored apart from the route, and a small thumbnail
 * that travels with the route in every list. Both are JPEG data URLs.
 */
export interface RouteImageInput {
  image: string;
  thumbnail: string;
}

/** What the admin did to the image of a route in the form; absent means it stays as it is. */
export type RouteImageChange = { kind: 'set'; input: RouteImageInput } | { kind: 'remove' };

/** Widest side and heaviest file of each variant; the API accepts up to 600 KB and 60 KB. */
const FULL = { maxWidth: 1280, maxKb: 500 };
const THUMBNAIL = { maxWidth: 480, maxKb: 50 };

/** Resizes a picked file into the full image and its thumbnail. Rejects with an `ImageFileError`. */
export async function buildRouteImage(file: Blob, codec: ImageCodec): Promise<RouteImageInput> {
  const image = await resizeToWidthJpeg(file, FULL.maxWidth, FULL.maxKb, codec);
  const thumbnail = await resizeToWidthJpeg(file, THUMBNAIL.maxWidth, THUMBNAIL.maxKb, codec);
  return { image, thumbnail };
}

/** Spanish text for the reason the API gives on the `image` or `thumbnail` field of an upload. */
export function routeImageReasonMessage(reason: string): string {
  switch (reason) {
    case 'required':
      return 'Elige una imagen.';
    case 'invalid-format':
      return 'La imagen debe ser JPG, PNG o WebP.';
    case 'invalid-image':
      return 'No pudimos leer la imagen. Prueba con otra.';
    case 'too-large':
      return 'La imagen pesa más de lo permitido. Prueba con otra.';
    default:
      return 'No se pudo guardar la imagen.';
  }
}
