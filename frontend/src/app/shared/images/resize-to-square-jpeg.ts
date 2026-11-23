import { browserImageCodec } from './browser-image-codec';
import { ImageCodec } from './image-codec';

/** A picture that cannot be used; its message is Spanish text that is safe to show. */
export class ImageFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageFileError';
  }
}

/** Largest file read from the device; bigger pictures are refused before decoding them. */
export const MAX_INPUT_BYTES = 15 * 1024 * 1024;

const QUALITIES = [0.9, 0.8, 0.7, 0.6, 0.5];
/** Each retry at the lowest quality shrinks the side by this factor. */
const SHRINK_FACTOR = 0.8;
const MIN_SIDE_PX = 32;

/** Size in bytes of the payload of a `data:...;base64,` URL. */
export function dataUrlBytes(dataUrl: string): number {
  const payload = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  return Math.floor((payload.length * 3) / 4) - padding;
}

/**
 * Turns a picked picture into a small square JPEG data URL: center-crops to a square, scales to at
 * most `maxPx`, then lowers the quality (0.9 to 0.5) and, if it still weighs more than `maxKb`,
 * shrinks the side until it fits. Rejects with an `ImageFileError`.
 */
export async function resizeToSquareJpeg(
  file: Blob,
  maxPx: number,
  maxKb: number,
  codec: ImageCodec = browserImageCodec,
): Promise<string> {
  if (!file.type.startsWith('image/')) throw new ImageFileError('El archivo no es una imagen.');
  if (file.size > MAX_INPUT_BYTES) throw new ImageFileError('La imagen pesa demasiado. Elige una de menos de 15 MB.');

  const image = await codec.decode(file).catch(() => {
    throw new ImageFileError('No pudimos leer la imagen. Prueba con otra.');
  });
  try {
    const side = Math.min(image.width, image.height);
    const crop = {
      sx: Math.floor((image.width - side) / 2),
      sy: Math.floor((image.height - side) / 2),
      side,
    };
    const limit = maxKb * 1024;
    for (let size = Math.min(maxPx, side); size >= MIN_SIDE_PX; size = Math.floor(size * SHRINK_FACTOR)) {
      for (const quality of QUALITIES) {
        const dataUrl = image.encode(crop, size, quality);
        if (dataUrlBytes(dataUrl) <= limit) return dataUrl;
      }
    }
    throw new ImageFileError('No pudimos reducir la foto al tamaño permitido. Prueba con otra.');
  } finally {
    image.close();
  }
}
