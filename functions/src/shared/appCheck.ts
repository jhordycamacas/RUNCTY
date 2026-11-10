/**
 * SEC-01: App Check enforcement for every callable, driven by the
 * `ENFORCE_APP_CHECK` environment variable. Only the exact string "true"
 * enables it; it is OFF by default because enforcing needs the provider
 * (Play Integrity) enabled in the Firebase console and the clients sending
 * App Check tokens. Set it in the functions environment when going to production.
 */
export function isAppCheckEnforced(env: Record<string, string | undefined> = process.env): boolean {
  return env.ENFORCE_APP_CHECK === 'true';
}
