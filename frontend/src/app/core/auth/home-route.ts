import { Session, hasPermission } from '../permissions/permissions';

/** Where a signed-in user lands: the admin area for administrators, the runner area otherwise. */
export function homeUrl(session: Session | null): string {
  return hasPermission(session, 'admin.access') ? '/admin' : '/app';
}

/**
 * Accepts only an in-app absolute path, so a crafted `returnUrl` cannot send the user to
 * another site after signing in.
 */
export function safeReturnUrl(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  return value;
}
