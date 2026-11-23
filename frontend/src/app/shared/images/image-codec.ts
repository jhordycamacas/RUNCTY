/** Region of the source picture, in source pixels, that becomes the square photo. */
export interface SquareCrop {
  sx: number;
  sy: number;
  side: number;
}

/** A decoded picture that can be drawn into a square JPEG. */
export interface DecodedImage {
  width: number;
  height: number;
  /** Draws the crop scaled to `size` x `size` and returns it as a JPEG data URL. */
  encode(crop: SquareCrop, size: number, quality: number): string;
  /** Frees the decoded pixels; the picture is not usable afterwards. */
  close(): void;
}

/**
 * The DOM side of image resizing (decoding and canvas), behind a port so the resize rules can be
 * tested without a real canvas. Rejects when the file cannot be decoded.
 */
export interface ImageCodec {
  decode(file: Blob): Promise<DecodedImage>;
}
