/**
 * Seeds the local Firebase emulators with the minimum data for development:
 * the pilot city (Loja) and an admin account.
 *
 * Usage: start the emulators (`npm run emulators`), then `npm run seed`.
 * It refuses to run against anything that is not the emulator.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'demo-runcty';
const ADMIN_EMAIL = 'admin@runcty.dev';
const ADMIN_PASSWORD = 'Admin123!';

function assertEmulator(): void {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.error(
      'Refusing to seed: FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST must point to the emulators.',
    );
    process.exit(1);
  }
}

async function seedCity(): Promise<void> {
  const db = getFirestore();
  await db.collection('cities').doc('loja').set(
    {
      name: 'Loja',
      province: 'Loja',
      country: 'EC',
      location: { lat: -3.99313, lng: -79.20422 },
      coverage: 'active',
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log('City seeded: cities/loja');
}

async function seedAdmin(): Promise<void> {
  const auth = getAuth();
  const user = await auth.getUserByEmail(ADMIN_EMAIL).catch(() =>
    auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: 'Administrador RUNCTY',
      emailVerified: true,
    }),
  );
  await auth.setCustomUserClaims(user.uid, { role: 'admin' });

  await getFirestore().collection('users').doc(user.uid).set(
    {
      uid: user.uid,
      email: ADMIN_EMAIL,
      firstName: 'Administrador',
      lastName: 'RUNCTY',
      cityId: 'loja',
      role: 'admin',
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`Admin seeded: ${ADMIN_EMAIL} (uid ${user.uid})`);
}

async function main(): Promise<void> {
  assertEmulator();
  initializeApp({ projectId: PROJECT_ID });
  await seedCity();
  await seedAdmin();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
