const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_HINT = 'Mínimo 8 caracteres, con al menos una letra y un número.';

/** Password policy (RF-01-1): at least 8 characters, one letter and one number. */
export function validatePassword(value: string): string | null {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (!/\p{L}/u.test(value)) return 'La contraseña debe incluir al menos una letra.';
  if (!/\d/.test(value)) return 'La contraseña debe incluir al menos un número.';
  return null;
}
