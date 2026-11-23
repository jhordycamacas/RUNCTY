import { DecodedImage, ImageCodec } from './image-codec';
import { dataUrlBytes } from './resize-to-square-jpeg';
import { resizeToWidthJpeg } from './resize-to-width-jpeg';

interface FitCall {
  width: number;
  height: number;
  quality: number;
}

/** A fake codec: the encoded size comes from `bytesFor(width, quality)`, no canvas involved. */
function fakeCodec(
  width: number,
  height: number,
  bytesFor: (width: number, quality: number) => number = () => 1000,
) {
  const calls: FitCall[] = [];
  const close = vi.fn();
  const codec: ImageCodec = {
    decode: vi.fn(async (): Promise<DecodedImage> => ({
      width,
      height,
      encode: () => {
        throw new Error('The width resize never crops');
      },
      encodeFit: (w, h, quality) => {
        calls.push({ width: w, height: h, quality });
        return `data:image/jpeg;base64,${'A'.repeat(Math.ceil(bytesFor(w, quality) / 3) * 4)}`;
      },
      close,
    })),
  };
  return { codec, calls, close };
}

const image = (type = 'image/png', size = 1000) =>
  ({ type, size, name: 'ruta' }) as unknown as File;

describe('resizeToWidthJpeg', () => {
  it('keeps the aspect ratio and scales down to the maximum width', async () => {
    const { codec, calls } = fakeCodec(2000, 1000);

    await resizeToWidthJpeg(image(), 1280, 500, codec);

    expect(calls[0]).toMatchObject({ width: 1280, height: 640 });
  });

  it('never scales a small picture up', async () => {
    const { codec, calls } = fakeCodec(300, 200);

    await resizeToWidthJpeg(image(), 480, 50, codec);

    expect(calls[0]).toMatchObject({ width: 300, height: 200 });
  });

  it('returns a JPEG data URL and releases the decoded picture', async () => {
    const { codec, close } = fakeCodec(800, 600);

    const result = await resizeToWidthJpeg(image(), 480, 50, codec);

    expect(result.startsWith('data:image/jpeg;base64,')).toBe(true);
    expect(close).toHaveBeenCalledOnce();
  });

  it('lowers the quality before touching the width', async () => {
    const { codec, calls } = fakeCodec(1000, 500, (_w, quality) => (quality > 0.75 ? 90_000 : 30_000));

    await resizeToWidthJpeg(image(), 480, 50, codec);

    expect(calls.map((call) => call.quality)).toEqual([0.9, 0.8, 0.7]);
    expect(new Set(calls.map((call) => call.width))).toEqual(new Set([480]));
  });

  it('shrinks the width when the lowest quality is still too big', async () => {
    const { codec, calls } = fakeCodec(1000, 500, (width) => (width > 300 ? 300_000 : 20_000));

    const result = await resizeToWidthJpeg(image(), 480, 50, codec);

    expect(calls.at(-1)?.width).toBeLessThanOrEqual(300);
    expect(dataUrlBytes(result)).toBeLessThanOrEqual(50 * 1024);
  });

  it('gives up with a Spanish message when nothing fits', async () => {
    const { codec } = fakeCodec(500, 500, () => 10_000_000);

    await expect(resizeToWidthJpeg(image(), 480, 50, codec)).rejects.toThrow(
      'No pudimos reducir la imagen al tamaño permitido. Prueba con otra.',
    );
  });

  it('rejects a file that is not an image without decoding it', async () => {
    const { codec } = fakeCodec(10, 10);

    await expect(resizeToWidthJpeg(image('application/pdf'), 480, 50, codec)).rejects.toThrow(
      'El archivo no es una imagen.',
    );
    expect(codec.decode).not.toHaveBeenCalled();
  });

  it('reports a picture the browser cannot decode', async () => {
    const codec: ImageCodec = { decode: vi.fn().mockRejectedValue(new Error('bad')) };

    await expect(resizeToWidthJpeg(image(), 480, 50, codec)).rejects.toThrow(
      'No pudimos leer la imagen. Prueba con otra.',
    );
  });
});
