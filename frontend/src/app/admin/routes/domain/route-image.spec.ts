import { DecodedImage, ImageCodec } from '../../../shared/images/image-codec';
import { buildRouteImage, routeImageReasonMessage } from './route-image';

function fakeCodec(): { codec: ImageCodec; widths: number[] } {
  const widths: number[] = [];
  const codec: ImageCodec = {
    decode: async (): Promise<DecodedImage> => ({
      width: 3000,
      height: 2000,
      encode: () => {
        throw new Error('never cropped');
      },
      encodeFit: (width) => {
        widths.push(width);
        return `data:image/jpeg;base64,${'A'.repeat(400)}`;
      },
      close: () => undefined,
    }),
  };
  return { codec, widths };
}

const file = { type: 'image/png', size: 1000 } as unknown as File;

describe('buildRouteImage', () => {
  it('makes a 1280 px image and a 480 px thumbnail from the same file', async () => {
    const { codec, widths } = fakeCodec();

    const built = await buildRouteImage(file, codec);

    expect(widths).toEqual([1280, 480]);
    expect(built.image.startsWith('data:image/jpeg;base64,')).toBe(true);
    expect(built.thumbnail.startsWith('data:image/jpeg;base64,')).toBe(true);
  });

  it('rejects a file that is not an image', async () => {
    const { codec } = fakeCodec();

    await expect(
      buildRouteImage({ type: 'text/plain', size: 1 } as unknown as File, codec),
    ).rejects.toThrow('El archivo no es una imagen.');
  });
});

describe('routeImageReasonMessage', () => {
  it.each([
    ['required', 'Elige una imagen.'],
    ['invalid-format', 'La imagen debe ser JPG, PNG o WebP.'],
    ['invalid-image', 'No pudimos leer la imagen. Prueba con otra.'],
    ['too-large', 'La imagen pesa más de lo permitido. Prueba con otra.'],
    ['other', 'No se pudo guardar la imagen.'],
  ])('translates %s', (reason, message) => {
    expect(routeImageReasonMessage(reason)).toBe(message);
  });
});
