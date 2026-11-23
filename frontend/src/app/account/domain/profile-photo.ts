/** The profile photo of the signed-in user, as a `data:image/...;base64,` URL. */
export abstract class ProfilePhotoRepository {
  /** `null` when the user has no photo. */
  abstract get(): Promise<string | null>;
  /** Replaces the photo and answers what the server stored. */
  abstract save(photo: string): Promise<string>;
  /** Idempotent: removing a missing photo is not an error. */
  abstract remove(): Promise<void>;
}

/** Spanish text for the reason the API gives on the `photo` field of a rejected upload. */
export function photoReasonMessage(reason: string): string {
  switch (reason) {
    case 'required':
      return 'Elige una foto.';
    case 'invalid-format':
      return 'La foto debe ser JPG, PNG o WebP.';
    case 'invalid-image':
      return 'No pudimos leer la imagen. Prueba con otra.';
    case 'too-large':
      return 'La foto pesa más de lo permitido. Prueba con otra.';
    default:
      return 'No se pudo guardar la foto.';
  }
}
