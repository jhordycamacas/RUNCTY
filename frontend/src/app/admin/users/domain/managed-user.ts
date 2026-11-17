/** A user as the admin list shows it; the API leaves the id number out (data minimization). */
export interface ManagedUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  cityId: string;
  /** `null` for an account without a role. */
  role: string | null;
}

export interface UserPage {
  users: ManagedUser[];
  /** Pass it back to read the next page; `null` when there are no more. */
  nextCursor: string | null;
}

export type UserFilters = Readonly<Record<string, string>>;

export abstract class UserAdminRepository {
  abstract search(filters: UserFilters, cursor: string | null): Promise<UserPage>;
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/** Tolerant read of one entry of `GET /users`. */
export function toManagedUser(raw: unknown): ManagedUser {
  const data = (raw ?? {}) as Record<string, unknown>;
  return {
    uid: text(data['uid']),
    email: text(data['email']),
    firstName: text(data['firstName']),
    lastName: text(data['lastName']),
    birthDate: text(data['birthDate']),
    cityId: text(data['cityId']),
    role: typeof data['role'] === 'string' && data['role'] ? data['role'] : null,
  };
}

export const fullName = (user: ManagedUser): string =>
  `${user.firstName} ${user.lastName}`.trim() || user.email;
