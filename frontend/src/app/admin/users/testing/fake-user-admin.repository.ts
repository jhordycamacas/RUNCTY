import { vi } from 'vitest';
import { ManagedUser, UserAdminRepository } from '../domain/managed-user';
import { UserDetail } from '../domain/user-detail';

export function fakeUserAdminRepository() {
  return {
    search: vi
      .fn<UserAdminRepository['search']>()
      .mockResolvedValue({ users: [], nextCursor: null }),
    get: vi.fn<UserAdminRepository['get']>().mockResolvedValue(userDetail('u1')),
    updatePersonalData: vi
      .fn<UserAdminRepository['updatePersonalData']>()
      .mockImplementation(async (uid, data) => ({ ...userDetail(uid).user, ...data })),
    saveSportProfile: vi
      .fn<UserAdminRepository['saveSportProfile']>()
      .mockImplementation(async (_uid, profile) => profile),
    clearSportProfile: vi
      .fn<UserAdminRepository['clearSportProfile']>()
      .mockResolvedValue(undefined),
    remove: vi.fn<UserAdminRepository['remove']>().mockResolvedValue(undefined),
  };
}

export type FakeUserAdminRepository = ReturnType<typeof fakeUserAdminRepository>;

export const user = (uid: string, overrides: Partial<ManagedUser> = {}): ManagedUser => ({
  uid,
  email: `${uid}@mail.com`,
  firstName: uid,
  lastName: 'Prueba',
  birthDate: '1995-04-23',
  cityId: 'loja',
  role: 'runner',
  ...overrides,
});

/** A complete detail: verified email, a sport profile and a rating. */
export const userDetail = (uid: string, overrides: Partial<UserDetail> = {}): UserDetail => ({
  user: {
    ...user(uid, { firstName: 'Ana', lastName: 'Pérez', email: 'ana@mail.com' }),
    idNumber: '1710034065',
    emailVerified: true,
    createdAt: '2026-03-05T10:00:00Z',
  },
  sportProfile: {
    level: 'beginner',
    goals: ['health', 'pace'],
    usualPaceSecPerKm: 390,
    preferredDistanceKm: 10,
  },
  rating: { average: 4.3, count: 12 },
  ...overrides,
});
