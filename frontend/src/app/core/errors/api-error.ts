/** Error of the REST API, already translated for the user. */
export class ApiError extends Error {
  constructor(
    /** HTTP status; 0 when the server could not be reached. */
    readonly status: number,
    /** Stable code the clients branch on (`unauthenticated`, `role-exists`, ...). */
    readonly reason: string,
    /** Spanish text safe to show. */
    override readonly message: string,
    /** Per-field reasons of a rejected body, with dotted names for nested fields. */
    readonly fields: Readonly<Record<string, string>> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
