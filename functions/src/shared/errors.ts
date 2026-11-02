/**
 * Domain errors raised by the pure logic of the callables.
 *
 * `code` is a Cloud Functions error code (mapped 1:1 to HttpsError by the
 * thin wrappers) and `reason` is a stable machine-readable key that the
 * admin panel translates into a Spanish message.
 */
export type DomainErrorCode =
  | 'invalid-argument'
  | 'not-found'
  | 'already-exists'
  | 'failed-precondition'
  | 'permission-denied';

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    readonly reason: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export const invalidArgument = (reason: string, message: string) => new DomainError('invalid-argument', reason, message);

/** Firebase Admin Auth error raised when the uid does not exist. */
export function isUserNotFound(error: unknown): boolean {
  return (error as { code?: unknown })?.code === 'auth/user-not-found';
}
