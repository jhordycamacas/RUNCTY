import { Injectable, computed, inject, signal } from '@angular/core';
import { userMessage } from '../../../core/errors/user-message';
import { Role, RoleAdminRepository, RoleCreateInput } from '../domain/role';

/**
 * The role catalogue (RF-02): the list, the role form and the role assignment of the users
 * screen share it, so a role is named the same everywhere.
 */
@Injectable()
export class AdminRolesStore {
  private readonly repository = inject(RoleAdminRepository);

  private readonly list = signal<Role[] | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly pending = signal(false);

  /** `null` until the roles arrive. */
  readonly roles = this.list.asReadonly();
  readonly error = this.failure.asReadonly();
  readonly loading = this.pending.asReadonly();

  private readonly names = computed(
    () => new Map((this.list() ?? []).map((role) => [role.id, role.name])),
  );

  /** The name of a role; a user without role, or with a deleted one, still reads well. */
  roleName(roleId: string | null): string {
    if (roleId === null) return 'Sin rol';
    return this.names().get(roleId) ?? roleId;
  }

  /** Asks the API again; the current list stays visible while it loads or if it fails. */
  async load(): Promise<void> {
    this.pending.set(true);
    this.failure.set(null);
    try {
      this.list.set(await this.repository.list());
    } catch (error) {
      this.failure.set(userMessage(error));
    } finally {
      this.pending.set(false);
    }
  }

  /** A role read fresh from the API, or `null` when it no longer exists. Throws if the API fails. */
  async find(roleId: string): Promise<Role | null> {
    const roles = await this.repository.list();
    this.list.set(roles);
    return roles.find((role) => role.id === roleId) ?? null;
  }

  /**
   * Creates (`roleId` null) or updates a role. An update resolves to how many users got their
   * access re-issued.
   */
  async save(roleId: string | null, input: RoleCreateInput): Promise<number> {
    if (roleId === null) {
      await this.repository.create(input);
      return 0;
    }
    return this.repository.update(roleId, {
      name: input.name,
      ...(input.description ? { description: input.description } : {}),
      permissions: input.permissions,
    });
  }

  async remove(roleId: string): Promise<void> {
    await this.repository.delete(roleId);
    this.list.update((roles) => roles?.filter((role) => role.id !== roleId) ?? null);
  }

  assign(uid: string, roleId: string): Promise<void> {
    return this.repository.setUserRole(uid, roleId);
  }
}
