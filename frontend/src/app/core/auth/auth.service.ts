import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { ApiError } from '../errors/api-error';
import { Permission, Session, hasPermission, isPermission } from '../permissions/permissions';
import { FirebaseAuthGateway } from './firebase-auth.gateway';

interface MeResponse {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  role: string | null;
  perms: unknown[];
}

/**
 * The signed-in user as the API sees it. Firebase only proves who the user is; the role and the
 * permissions always come from `GET /me`, never from the client.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly gateway = inject(FirebaseAuthGateway);
  private readonly api = inject(ApiClient);
  private readonly current = signal<Session | null>(null);
  private restoring: Promise<void> | null = null;

  readonly session = this.current.asReadonly();

  /** Restores the stored session once; guards await it before deciding. */
  restore(): Promise<void> {
    this.restoring ??= this.loadStoredSession();
    return this.restoring;
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.gateway.signIn(email, password);
    try {
      await this.loadSession();
    } catch (error) {
      await this.gateway.signOut();
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await this.gateway.signOut();
    this.current.set(null);
  }

  can(permission: Permission): boolean {
    return hasPermission(this.current(), permission);
  }

  private async loadStoredSession(): Promise<void> {
    if (!(await this.gateway.hasUser())) return;
    try {
      await this.loadSession();
    } catch (error) {
      // The server refused this user (revoked, disabled): drop it. If the server is only
      // unreachable the user is kept, so the next attempt can restore the session.
      if (error instanceof ApiError && error.status !== 0) await this.gateway.signOut();
    }
  }

  private async loadSession(): Promise<void> {
    const me = await firstValueFrom(this.api.get<MeResponse>('/me'));
    this.current.set({ ...me, perms: me.perms.filter(isPermission) });
  }
}
