/**
 * SEC-05: pure guard for the seed script. The seed writes an admin account with
 * a known password, so it must only ever run against local emulators.
 * Returns an error message, or null when the target is safe.
 */
const ALLOWED_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', 'firebase']);

export interface SeedTarget {
  projectId: string | undefined;
  firestoreHost: string | undefined;
  authHost: string | undefined;
}

/** Strips the port and IPv6 brackets: `[::1]:9099` -> `::1`, `firebase:8080` -> `firebase`. */
function hostOf(hostPort: string): string {
  if (hostPort.startsWith('[')) return hostPort.slice(1, hostPort.indexOf(']'));
  const colon = hostPort.lastIndexOf(':');
  // A bare IPv6 literal has several colons and no port.
  return colon === -1 || hostPort.indexOf(':') !== colon ? hostPort : hostPort.slice(0, colon);
}

export function checkSeedTarget({ projectId, firestoreHost, authHost }: SeedTarget): string | null {
  if (!firestoreHost || !authHost) {
    return 'Refusing to seed: FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST must point to the emulators.';
  }
  if (!projectId?.startsWith('demo-')) {
    return 'Refusing to seed: the project id must start with "demo-".';
  }
  for (const hostPort of [firestoreHost, authHost]) {
    if (!ALLOWED_HOSTS.has(hostOf(hostPort))) {
      return `Refusing to seed: "${hostPort}" is not a loopback host (127.0.0.1, localhost, ::1) or the Docker "firebase" service.`;
    }
  }
  return null;
}
