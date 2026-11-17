import { vi } from 'vitest';
import { ManagedUser, UserAdminRepository } from '../domain/managed-user';

export function fakeUserAdminRepository() {
  return {
    search: vi
      .fn<UserAdminRepository['search']>()
      .mockResolvedValue({ users: [], nextCursor: null }),
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
