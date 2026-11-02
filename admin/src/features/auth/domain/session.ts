import type { AccessClaims } from '@/core/permissions/permissions';

export interface AdminSession {
  uid: string;
  email: string;
  claims: AccessClaims;
}
