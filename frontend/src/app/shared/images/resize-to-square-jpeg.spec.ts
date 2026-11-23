import { DecodedImage, ImageCodec } from './image-codec';
import { dataUrlBytes, resizeToSquareJpeg } from './resize-to-square-jpeg';

interface EncodeCall {
  sx: number;
  sy: number;
  side: number;
  size: number;
  quality: number;
}

/** A fake codec: the encoded size comes from `bytesFor(size, quality)`, no canvas involved. */
function fakeCodec(
  width: number,
  height: number,
  bytesFor: (size: number, quality: number) => number = () => 1000,
) {
  const calls: EncodeCall[] = [];
  const close = vi.fn();
  const codec: ImageCodec = {
    decode: vi.fn(async (): Promise<DecodedImage> => ({
      width,
      height,
      encode: (crop, size, quality) => {
        calls.push({ ...crop, size, quality });
        return `data:image/jpeg;base64,${'A'.repeat(Math.ceil(bytesFor(size, quality) / 3) * 4)}`;
      },
      close,
    })),
  };
  return { codec, calls, close };
}

const image = (type = 'image/png', size = 1000) =>
  ({ type, size, name: 'foto' }) as unknown as File;

describe('dataUrlBytes', () => {
  it('measures the decoded payload, ignoring base64 padding', () => {
    expect(dataUrlBytes('data:image/jpeg;base64,AAAA')).toBe(3);
    expect(dataUrlBytes('data:image/jpeg;base64,AAA=')).toBe(2);
    expect(dataUrlBytes('data:image/jpeg;base64,AA==')).toBe(1);
  });
});

describe('resizeToSquareJpeg', () => {
  it('center-crops a landscape picture to a square', async () => {
    const { codec, calls } = fakeCodec(400, 200);

    await resizeToSquareJpeg(image(), 256, 100, codec);

    expect(calls[0]).toMatchObject({ sx: 100, sy: 0, side: 200 });
  });

  it('center-crops a portrait picture to a square', async () => {
    const { codec, calls } = fakeCodec(200, 601);

    await resizeToSquareJpeg(image(), 256, 100, codec);

    expect(calls[0]).toMatchObject({ sx: 0, sy: 200, side: 200 });
  });

  it('scales down to maxPx but never scales a small picture up', async () => {
    const big = fakeCodec(2000, 1500);
    const small = fakeCodec(100, 80);

    await resizeToSquareJpeg(image(), 256, 100, big.codec);
    await resizeToSquareJpeg(image(), 256, 100, small.codec);

    expect(big.calls[0].size).toBe(256);
    expect(small.calls[0].size).toBe(80);
  });

  it('returns a JPEG data URL and releases the decoded picture', async () => {
    const { codec, close } = fakeCodec(300, 300);

    const result = await resizeToSquareJpeg(image(), 256, 100, codec);

    expect(result.startsWith('data:image/jpeg;base64,')).toBe(true);
    expect(close).toHaveBeenCalledOnce();
  });

  it('lowers the quality step by step before touching the dimension', async () => {
    // Only quality 0.7 or less fits 100 KB at 256 px.
    const { codec, calls } = fakeCodec(500, 500, (_size, quality) => (quality > 0.75 ? 200_000 : 50_000));

    await resizeToSquareJpeg(image(), 256, 100, codec);

    expect(calls.map((call) => call.quality)).toEqual([0.9, 0.8, 0.7]);
    expect(new Set(calls.map((call) => call.size))).toEqual(new Set([256]));
  });

  it('shrinks the dimension when the lowest quality is still too big', async () => {
    const { codec, calls } = fakeCodec(500, 500, (size) => (size > 150 ? 300_000 : 20_000));

    const result = await resizeToSquareJpeg(image(), 256, 100, codec);

    expect(calls.at(-1)?.quality).toBe(0.9);
    expect(calls.at(-1)?.size).toBeLessThanOrEqual(150);
    expect(dataUrlBytes(result)).toBeLessThanOrEqual(100 * 1024);
  });

  it('gives up with a Spanish message when nothing fits', async () => {
    const { codec } = fakeCodec(500, 500, () => 10_000_000);

    await expect(resizeToSquareJpeg(image(), 256, 100, codec)).rejects.toThrow(
      'No pudimos reducir la foto al tamaño permitido. Prueba con otra.',
    );
  });

  it('rejects a file that is not an image', async () => {
    const { codec } = fakeCodec(10, 10);

    await expect(resizeToSquareJpeg(image('application/pdf'), 256, 100, codec)).rejects.toThrow(
      'El archivo no es una imagen.',
    );
    expect(codec.decode).not.toHaveBeenCalled();
  });

  it('rejects a file over the input cap without decoding it', async () => {
    const { codec } = fakeCodec(10, 10);

    await expect(resizeToSquareJpeg(image('image/jpeg', 16 * 1024 * 1024), 256, 100, codec)).rejects.toThrow(
      'La imagen pesa demasiado. Elige una de menos de 15 MB.',
    );
    expect(codec.decode).not.toHaveBeenCalled();
  });

  it('reports a picture the browser cannot decode', async () => {
    const codec: ImageCodec = { decode: vi.fn().mockRejectedValue(new Error('bad')) };

    await expect(resizeToSquareJpeg(image(), 256, 100, codec)).rejects.toThrow(
      'No pudimos leer la imagen. Prueba con otra.',
    );
  });
});
