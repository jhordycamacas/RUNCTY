import { InjectionToken } from '@angular/core';
import { DecodedImage, ImageCodec } from './image-codec';

type Source = ImageBitmap | HTMLImageElement;

function loadImageElement(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => {
      URL.revokeObjectURL(url);
      resolve(element);
    };
    element.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The image could not be decoded'));
    };
    element.src = url;
  });
}

/** `createImageBitmap` honours the EXIF rotation; an `Image` element is the fallback. */
async function decodeSource(file: Blob): Promise<Source> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Falls through to the Image element, which some WebViews decode better.
    }
  }
  return loadImageElement(file);
}

function whiteCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available');
  // JPEG has no transparency: a transparent PNG would turn black without this.
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  return { canvas, context };
}

/** The real codec: decoding by the browser and drawing on an off-screen canvas. */
export const browserImageCodec: ImageCodec = {
  async decode(file: Blob): Promise<DecodedImage> {
    const source = await decodeSource(file);
    return {
      width: source.width,
      height: source.height,
      encode(crop, size, quality) {
        const { canvas, context } = whiteCanvas(size, size);
        context.drawImage(source, crop.sx, crop.sy, crop.side, crop.side, 0, 0, size, size);
        return canvas.toDataURL('image/jpeg', quality);
      },
      encodeFit(width, height, quality) {
        const { canvas, context } = whiteCanvas(width, height);
        context.drawImage(source, 0, 0, width, height);
        return canvas.toDataURL('image/jpeg', quality);
      },
      close() {
        if ('close' in source) source.close();
      },
    };
  },
};

/** The codec the app uses; specs provide a fake one instead of a real canvas. */
export const IMAGE_CODEC = new InjectionToken<ImageCodec>('IMAGE_CODEC', {
  providedIn: 'root',
  factory: () => browserImageCodec,
});
