import { vi } from 'vitest';
import { Permission } from '../../../core/permissions/permissions';
import { Role, RoleAdminRepository } from '../domain/role';

/** Every port method as a mock, answering an empty catalogue unless a test says otherwise. */
export function fakeRoleAdminRepository() {
  return {
    list: vi.fn<RoleAdminRepository['list']>().mockResolvedValue([]),
    create: vi.fn<RoleAdminRepository['create']>().mockResolvedValue(undefined),
    update: vi.fn<RoleAdminRepository['update']>().mockResolvedValue(0),
    delete: vi.fn<RoleAdminRepository['delete']>().mockResolvedValue(undefined),
    setUserRole: vi.fn<RoleAdminRepository['setUserRole']>().mockResolvedValue(undefined),
  };
}

export type FakeRoleAdminRepository = ReturnType<typeof fakeRoleAdminRepository>;

export const role = (id: string, overrides: Partial<Role> = {}): Role => ({
  id,
  name: id,
  description: '',
  permissions: [] as Permission[],
  system: false,
  ...overrides,
});

/** Lets pending promises and the renders they trigger settle. */
export async function settle(fixture: { detectChanges(): void }): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }
}
