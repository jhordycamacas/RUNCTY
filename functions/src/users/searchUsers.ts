/**
 * RF-01-2: the administrator searches users with filters.
 *
 * Exact filters (email, id number, birth date, city) run in Firestore as
 * equality filters. Names are matched in memory with a case- and
 * accent-insensitive prefix over a bounded scan: Firestore cannot do
 * accent-insensitive matching, and the pilot (one club in Loja) has
 * hundreds of users, not millions. Each request reads at most
 * `maxScanned` docs and returns a cursor to continue.
 */
import { invalidArgument } from '../shared/errors';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
const DEFAULT_SCAN = { batchSize: 200, maxScanned: 1000 };

export interface SearchFilters {
  firstName?: string;
  lastName?: string;
  email?: string;
  idNumber?: string;
  birthDate?: string;
  cityId?: string;
}

export interface SearchUsersQuery {
  filters: SearchFilters;
  limit: number;
  /** Id of the last scanned doc of the previous page. */
  cursor?: string;
}

/** Fields returned to the admin panel (data minimization, LOPDP). */
export interface UserSummary {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  cityId: string;
  role: string;
}

export interface StoredUser {
  id: string;
  data: Record<string, unknown>;
}

export type EqualityFilter = [field: 'email' | 'idNumber' | 'birthDate' | 'cityId', value: string];

export interface SearchUsersDeps {
  /** Docs matching every filter, ordered by document id, after `startAfter`. */
  scan(filters: EqualityFilter[], startAfter: string | undefined, batchSize: number): Promise<StoredUser[]>;
}

export interface SearchUsersResult {
  users: UserSummary[];
  nextCursor: string | null;
}

const TEXT_FILTERS = ['firstName', 'lastName', 'email', 'idNumber', 'birthDate', 'cityId'] as const;
const FORMATS: Partial<Record<(typeof TEXT_FILTERS)[number], RegExp>> = {
  idNumber: /^[0-9]{10}$/,
  birthDate: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
};

export function parseSearchUsersInput(raw: unknown): SearchUsersQuery {
  const input = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const filters: SearchFilters = {};

  for (const key of TEXT_FILTERS) {
    const value = input[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== 'string' || value.length > 120) {
      throw invalidArgument('invalid-filter', `Filter "${key}" must be text.`);
    }
    const trimmed = key === 'email' ? value.trim().toLowerCase() : value.trim();
    if (trimmed.length === 0) continue;
    const format = FORMATS[key];
    if (format && !format.test(trimmed)) {
      throw invalidArgument('invalid-filter', `Filter "${key}" has an invalid format.`);
    }
    filters[key] = trimmed;
  }

  let limit = DEFAULT_PAGE_SIZE;
  if (input.limit !== undefined) {
    if (typeof input.limit !== 'number' || !Number.isInteger(input.limit) || input.limit < 1) {
      throw invalidArgument('invalid-limit', 'limit must be a positive integer.');
    }
    limit = Math.min(input.limit, MAX_PAGE_SIZE);
  }

  const cursor = input.cursor;
  if (cursor !== undefined && cursor !== null && (typeof cursor !== 'string' || cursor.length > 128)) {
    throw invalidArgument('invalid-cursor', 'cursor must be a document id.');
  }

  return { filters, limit, cursor: typeof cursor === 'string' && cursor.length > 0 ? cursor : undefined };
}

export function buildEqualityFilters(filters: SearchFilters): EqualityFilter[] {
  const result: EqualityFilter[] = [];
  for (const field of ['email', 'idNumber', 'birthDate', 'cityId'] as const) {
    const value = filters[field];
    if (value) result.push([field, value]);
  }
  return result;
}

/** Lowercase, no accents (é → e, ñ → n), collapsed spaces. */
export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function matchesNamePrefixes(data: Record<string, unknown>, filters: Pick<SearchFilters, 'firstName' | 'lastName'>): boolean {
  const matches = (field: unknown, prefix: string | undefined) =>
    !prefix || (typeof field === 'string' && normalizeName(field).startsWith(normalizeName(prefix)));
  return matches(data.firstName, filters.firstName) && matches(data.lastName, filters.lastName);
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

export function toUserSummary({ id, data }: StoredUser): UserSummary {
  return {
    uid: id,
    email: text(data.email),
    firstName: text(data.firstName),
    lastName: text(data.lastName),
    birthDate: text(data.birthDate),
    cityId: text(data.cityId),
    role: text(data.role),
  };
}

export async function searchUsers(
  query: SearchUsersQuery,
  deps: SearchUsersDeps,
  scanOptions: { batchSize: number; maxScanned: number } = DEFAULT_SCAN,
): Promise<SearchUsersResult> {
  const equality = buildEqualityFilters(query.filters);
  const users: UserSummary[] = [];
  let cursor = query.cursor;
  let scanned = 0;

  while (scanned < scanOptions.maxScanned) {
    const batchSize = Math.min(scanOptions.batchSize, scanOptions.maxScanned - scanned);
    const batch = await deps.scan(equality, cursor, batchSize);

    for (const doc of batch) {
      cursor = doc.id;
      scanned += 1;
      if (matchesNamePrefixes(doc.data, query.filters)) {
        users.push(toUserSummary(doc));
        if (users.length === query.limit) {
          // More docs may match after this one; the next page resumes here.
          return { users, nextCursor: cursor };
        }
      }
    }

    if (batch.length < batchSize) return { users, nextCursor: null };
  }

  // Scan budget exhausted: let the admin continue from the last scanned doc.
  return { users, nextCursor: cursor ?? null };
}
