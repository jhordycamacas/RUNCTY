import { browserImageCodec } from './browser-image-codec';
import { ImageCodec } from './image-codec';
import {
  ImageFileError,
  MIN_SIDE_PX,
  QUALITIES,
  SHRINK_FACTOR,
  dataUrlBytes,
  decodeImageFile,
} from './resize-to-square-jpeg';

/**
 * Turns a picked picture into a JPEG data URL that keeps its aspect ratio: scales it to at most
 * `maxWidth` wide (never up), then lowers the quality (0.9 to 0.5) and, if it still weighs more
 * than `maxKb`, shrinks it until it fits. Rejects with an `ImageFileError`.
 */
export async function resizeToWidthJpeg(
  file: Blob,
  maxWidth: number,
  maxKb: number,
  codec: ImageCodec = browserImageCodec,
): Promise<string> {
  const image = await decodeImageFile(file, codec);
  try {
    const limit = maxKb * 1024;
    const ratio = image.height / image.width;
    for (
      let width = Math.min(maxWidth, image.width);
      width >= MIN_SIDE_PX;
      width = Math.floor(width * SHRINK_FACTOR)
    ) {
      const height = Math.max(1, Math.round(width * ratio));
      for (const quality of QUALITIES) {
        const dataUrl = image.encodeFit(width, height, quality);
        if (dataUrlBytes(dataUrl) <= limit) return dataUrl;
      }
    }
    throw new ImageFileError('No pudimos reducir la imagen al tamaño permitido. Prueba con otra.');
  } finally {
    image.close();
  }
}
