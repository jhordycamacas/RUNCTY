import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, deleteField, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const PROJECT_ID = 'demo-runcty';
const ALICE = 'alice';
const BOB = 'bob';
const ADMIN = 'admin-1';

let testEnv: RulesTestEnvironment;

const aliceDoc = {
  uid: ALICE,
  email: 'alice@runcty.dev',
  firstName: 'Alice',
  lastName: 'Andrade',
  birthDate: '1995-04-12',
  cityId: 'loja',
  consent: { lopdp: true, acceptedAt: 1 },
  createdAt: 1,
  updatedAt: 1,
};

/** A valid sign-up payload as the mobile app writes it. */
function newUserDoc(uid: string, email: string, overrides: Record<string, unknown> = {}) {
  return {
    uid,
    email,
    firstName: 'Bob',
    lastName: 'Bermeo',
    birthDate: '2000-01-31',
    cityId: 'loja',
    idNumber: '1104567890',
    consent: { lopdp: true, acceptedAt: serverTimestamp() },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../../firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', ALICE), { ...aliceDoc, role: 'runner' });
    await setDoc(doc(ctx.firestore(), 'cities', 'loja'), {
      name: 'Loja',
      province: 'Loja',
      country: 'EC',
      type: 'city',
      location: { lat: -3.99313, lng: -79.20422 },
      coverage: 'active',
      createdAt: 1,
      updatedAt: 1,
    });
  });
});

const alice = () => testEnv.authenticatedContext(ALICE).firestore();
const BOB_EMAIL = 'bob@runcty.dev';
const bob = () => testEnv.authenticatedContext(BOB, { email: BOB_EMAIL }).firestore();
const admin = () => testEnv.authenticatedContext(ADMIN, { role: 'admin' }).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();
/** Custom roles: permissions travel in the `perms` claim. */
const userReader = () =>
  testEnv.authenticatedContext('support-1', { role: 'support', perms: ['admin.access', 'users.read'] }).firestore();
const cityManager = () =>
  testEnv.authenticatedContext('cities-1', { role: 'editor', perms: ['admin.access', 'cities.manage'] }).firestore();
const roleManager = () =>
  testEnv.authenticatedContext('manager-1', { role: 'manager', perms: ['admin.access', 'roles.manage'] }).firestore();

describe('users/{uid}', () => {
  it('lets the owner read their own user doc', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'users', ALICE)));
  });

  it('denies reading another user doc', async () => {
    await assertFails(getDoc(doc(bob(), 'users', ALICE)));
    await assertFails(getDoc(doc(anon(), 'users', ALICE)));
  });

  it('lets an admin read any user doc', async () => {
    await assertSucceeds(getDoc(doc(admin(), 'users', ALICE)));
  });

  it('lets a user create their own valid doc without a role', async () => {
    await assertSucceeds(setDoc(doc(bob(), 'users', BOB), newUserDoc(BOB, BOB_EMAIL)));
  });

  it('lets a user sign up without the optional id number', async () => {
    const { idNumber: _omit, ...withoutId } = newUserDoc(BOB, BOB_EMAIL);
    await assertSucceeds(setDoc(doc(bob(), 'users', BOB), withoutId));
  });

  it('denies creating a doc that sets a role', async () => {
    await assertFails(setDoc(doc(bob(), 'users', BOB), newUserDoc(BOB, BOB_EMAIL, { role: 'admin' })));
    await assertFails(setDoc(doc(bob(), 'users', BOB), newUserDoc(BOB, BOB_EMAIL, { role: 'runner' })));
  });

  it('denies creating a doc for another uid', async () => {
    await assertFails(setDoc(doc(bob(), 'users', ALICE), newUserDoc(ALICE, BOB_EMAIL)));
    await assertFails(setDoc(doc(bob(), 'users', BOB), newUserDoc(ALICE, BOB_EMAIL)));
  });

  it('denies an email that does not match the auth token', async () => {
    await assertFails(setDoc(doc(bob(), 'users', BOB), newUserDoc(BOB, 'someone@runcty.dev')));
  });

  it('denies sign-up without LOPDP consent', async () => {
    await assertFails(
      setDoc(doc(bob(), 'users', BOB), newUserDoc(BOB, BOB_EMAIL, { consent: { lopdp: false, acceptedAt: serverTimestamp() } })),
    );
    const { consent: _omit, ...withoutConsent } = newUserDoc(BOB, BOB_EMAIL);
    await assertFails(setDoc(doc(bob(), 'users', BOB), withoutConsent));
  });

  it('denies missing or malformed required fields', async () => {
    const { lastName: _omit, ...withoutLastName } = newUserDoc(BOB, BOB_EMAIL);
    await assertFails(setDoc(doc(bob(), 'users', BOB), withoutLastName));
    await assertFails(setDoc(doc(bob(), 'users', BOB), newUserDoc(BOB, BOB_EMAIL, { firstName: '' })));
    await assertFails(setDoc(doc(bob(), 'users', BOB), newUserDoc(BOB, BOB_EMAIL, { birthDate: '31/01/2000' })));
    await assertFails(setDoc(doc(bob(), 'users', BOB), newUserDoc(BOB, BOB_EMAIL, { idNumber: '12345' })));
    await assertFails(setDoc(doc(bob(), 'users', BOB), newUserDoc(BOB, BOB_EMAIL, { cityId: '' })));
  });

  it('denies client-chosen timestamps and unknown fields', async () => {
    await assertFails(setDoc(doc(bob(), 'users', BOB), newUserDoc(BOB, BOB_EMAIL, { createdAt: 1 })));
    await assertFails(setDoc(doc(bob(), 'users', BOB), newUserDoc(BOB, BOB_EMAIL, { isVerified: true })));
  });

  it('lets the owner update personal data with a server timestamp', async () => {
    const ref = doc(alice(), 'users', ALICE);
    await assertSucceeds(updateDoc(ref, { firstName: 'Alicia', idNumber: '1104567890', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref, { idNumber: deleteField(), updatedAt: serverTimestamp() }));
  });

  it('requires updatedAt to be the server time', async () => {
    const ref = doc(alice(), 'users', ALICE);
    await assertFails(updateDoc(ref, { firstName: 'Alicia' }));
    await assertFails(updateDoc(ref, { firstName: 'Alicia', updatedAt: 5 }));
  });

  it('denies invalid personal data on update', async () => {
    const ref = doc(alice(), 'users', ALICE);
    await assertFails(updateDoc(ref, { firstName: '', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { birthDate: '12/04/1995', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { idNumber: '123', updatedAt: serverTimestamp() }));
  });

  it('denies the owner modifying role, uid, email, consent or createdAt', async () => {
    const ref = doc(alice(), 'users', ALICE);
    const now = serverTimestamp();
    await assertFails(updateDoc(ref, { role: 'admin', updatedAt: now }));
    await assertFails(updateDoc(ref, { uid: BOB, updatedAt: now }));
    await assertFails(updateDoc(ref, { email: 'other@runcty.dev', updatedAt: now }));
    await assertFails(updateDoc(ref, { createdAt: 2, updatedAt: now }));
    await assertFails(updateDoc(ref, { consent: { lopdp: false, acceptedAt: 1 }, updatedAt: now }));
    await assertFails(updateDoc(ref, { isVerified: true, updatedAt: now }));
  });

  it('denies clients deleting the user doc (the deleteAccount function does it)', async () => {
    await assertFails(deleteDoc(doc(alice(), 'users', ALICE)));
  });

  it('denies another user updating the doc', async () => {
    await assertFails(updateDoc(doc(bob(), 'users', ALICE), { firstName: 'Hacked' }));
  });
});

describe('users/{uid}/private/{doc}', () => {
  it('lets the owner read and write the known private docs', async () => {
    const ref = doc(alice(), 'users', ALICE, 'private', 'preferences');
    await assertSucceeds(setDoc(ref, validPreferences()));
    await assertSucceeds(getDoc(ref));
  });

  it('denies other users', async () => {
    await assertFails(getDoc(doc(bob(), 'users', ALICE, 'private', 'preferences')));
    await assertFails(setDoc(doc(bob(), 'users', ALICE, 'private', 'preferences'), validPreferences()));
    await assertFails(setDoc(doc(bob(), 'users', ALICE, 'private', 'sportProfile'), validSportProfile()));
  });

  it('denies writing unknown private docs', async () => {
    await assertFails(setDoc(doc(alice(), 'users', ALICE, 'private', 'anything'), { a: 1 }));
  });
});

function validPreferences(overrides: Record<string, unknown> = {}) {
  return {
    language: 'es',
    fontScale: 'normal',
    appearance: 'system',
    units: 'metric',
    notifications: { enabled: true, safetyAlerts: true, events: false },
    locationPrivacy: 'trustedContactsDuringSession',
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

describe('users/{uid}/private/preferences', () => {
  const ref = () => doc(alice(), 'users', ALICE, 'private', 'preferences');

  it('lets the owner create, read, update and delete (reset) valid preferences', async () => {
    await assertSucceeds(setDoc(ref(), validPreferences()));
    await assertSucceeds(getDoc(ref()));
    await assertSucceeds(
      setDoc(ref(), validPreferences({ fontScale: 'xlarge', appearance: 'dark', units: 'imperial', locationPrivacy: 'off' })),
    );
    await assertSucceeds(deleteDoc(ref()));
  });

  it('denies another user deleting the preferences', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', ALICE, 'private', 'preferences'), { language: 'es' });
    });
    await assertFails(deleteDoc(doc(bob(), 'users', ALICE, 'private', 'preferences')));
  });

  it('rejects values outside the enums', async () => {
    await assertFails(setDoc(ref(), validPreferences({ language: 'en' })));
    await assertFails(setDoc(ref(), validPreferences({ fontScale: 'huge' })));
    await assertFails(setDoc(ref(), validPreferences({ fontScale: 1.3 })));
    await assertFails(setDoc(ref(), validPreferences({ appearance: 'sepia' })));
    await assertFails(setDoc(ref(), validPreferences({ units: 'nautical' })));
    await assertFails(setDoc(ref(), validPreferences({ locationPrivacy: 'everyone' })));
  });

  it('rejects malformed notifications', async () => {
    await assertFails(setDoc(ref(), validPreferences({ notifications: true })));
    await assertFails(setDoc(ref(), validPreferences({ notifications: { enabled: true, safetyAlerts: true } })));
    await assertFails(
      setDoc(ref(), validPreferences({ notifications: { enabled: 'yes', safetyAlerts: true, events: true } })),
    );
    await assertFails(
      setDoc(ref(), validPreferences({ notifications: { enabled: true, safetyAlerts: true, events: true, sms: true } })),
    );
  });

  it('rejects missing fields, extra fields and client timestamps', async () => {
    const { units: _omit, ...withoutUnits } = validPreferences();
    await assertFails(setDoc(ref(), withoutUnits));
    await assertFails(setDoc(ref(), validPreferences({ darkMode: true })));
    await assertFails(setDoc(ref(), validPreferences({ updatedAt: 1 })));
  });
});

function validSportProfile(overrides: Record<string, unknown> = {}) {
  return {
    level: 'intermediate',
    goals: ['health', 'racePrep'],
    usualPaceSecPerKm: 360,
    preferredDistanceKm: 10,
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

describe('users/{uid}/private/sportProfile', () => {
  const ref = () => doc(alice(), 'users', ALICE, 'private', 'sportProfile');

  it('lets the owner create, read, update and delete a valid sport profile', async () => {
    await assertSucceeds(setDoc(ref(), validSportProfile()));
    await assertSucceeds(getDoc(ref()));
    await assertSucceeds(setDoc(ref(), validSportProfile({ level: 'advanced', goals: ['pace'] })));
    await assertSucceeds(deleteDoc(ref()));
  });

  it('rejects an unknown level or goal', async () => {
    await assertFails(setDoc(ref(), validSportProfile({ level: 'pro' })));
    await assertFails(setDoc(ref(), validSportProfile({ goals: ['fly'] })));
    await assertFails(setDoc(ref(), validSportProfile({ goals: [] })));
  });

  it('rejects pace and distance outside their ranges', async () => {
    await assertFails(setDoc(ref(), validSportProfile({ usualPaceSecPerKm: 149 })));
    await assertFails(setDoc(ref(), validSportProfile({ usualPaceSecPerKm: 1201 })));
    await assertFails(setDoc(ref(), validSportProfile({ usualPaceSecPerKm: '360' })));
    await assertFails(setDoc(ref(), validSportProfile({ preferredDistanceKm: 0 })));
    await assertFails(setDoc(ref(), validSportProfile({ preferredDistanceKm: 51 })));
  });

  it('rejects missing fields, extra fields and client timestamps', async () => {
    const { goals: _omit, ...withoutGoals } = validSportProfile();
    await assertFails(setDoc(ref(), withoutGoals));
    await assertFails(setDoc(ref(), validSportProfile({ weightKg: 70 })));
    await assertFails(setDoc(ref(), validSportProfile({ updatedAt: 1 })));
  });
});

describe('cities/{id}', () => {
  it('lets anyone read cities (public catalog, needed by the sign-up city picker)', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'cities', 'loja')));
    await assertSucceeds(getDoc(doc(anon(), 'cities', 'loja')));
  });

  it('denies runners writing cities', async () => {
    await assertFails(setDoc(doc(alice(), 'cities', 'quito'), validCity()));
    const runner = testEnv.authenticatedContext(BOB, { role: 'runner', perms: [] }).firestore();
    await assertFails(setDoc(doc(runner, 'cities', 'quito'), validCity()));
    await assertFails(setDoc(doc(userReader(), 'cities', 'quito'), validCity()));
  });

  it('lets cities.manage (and admin) create valid cities and zones', async () => {
    await assertSucceeds(setDoc(doc(cityManager(), 'cities', 'quito'), validCity()));
    await assertSucceeds(setDoc(doc(admin(), 'cities', 'cuenca'), validCity({ name: 'Cuenca', province: 'Azuay' })));
    await assertSucceeds(setDoc(doc(cityManager(), 'cities', 'loja-centro'), validZone()));
  });

  it('validates the city fields', async () => {
    const ref = doc(cityManager(), 'cities', 'quito');
    await assertFails(setDoc(ref, validCity({ name: '' })));
    await assertFails(setDoc(ref, validCity({ country: 'PE' })));
    await assertFails(setDoc(ref, validCity({ type: 'region' })));
    await assertFails(setDoc(ref, validCity({ coverage: 'inactive' })));
    await assertFails(setDoc(ref, validCity({ location: { lat: 91, lng: 0 } })));
    await assertFails(setDoc(ref, validCity({ location: { lat: 0, lng: -181 } })));
    await assertFails(setDoc(ref, validCity({ location: { lat: '0', lng: 0 } })));
    await assertFails(setDoc(ref, validCity({ location: { lat: 0, lng: 0, alt: 1 } })));
    await assertFails(setDoc(ref, validCity({ createdAt: 1 })));
    await assertFails(setDoc(ref, validCity({ extra: true })));
    const { province: _omit, ...withoutProvince } = validCity();
    await assertFails(setDoc(ref, withoutProvince));
  });

  it('requires zones to belong to an existing city and cities to have no parent', async () => {
    await assertFails(setDoc(doc(cityManager(), 'cities', 'z1'), validZone({ parentCityId: 'ghost' })));
    const { parentCityId: _omit, ...zoneWithoutParent } = validZone();
    await assertFails(setDoc(doc(cityManager(), 'cities', 'z1'), zoneWithoutParent));
    await assertFails(setDoc(doc(cityManager(), 'cities', 'quito'), validCity({ parentCityId: 'loja' })));
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cities', 'loja-centro'), { ...validZone(), createdAt: 1, updatedAt: 1 });
    });
    // No zones inside zones.
    await assertFails(setDoc(doc(cityManager(), 'cities', 'z2'), validZone({ parentCityId: 'loja-centro' })));
  });

  it('lets cities.manage update a city keeping createdAt and type', async () => {
    const ref = doc(cityManager(), 'cities', 'loja');
    await assertSucceeds(updateDoc(ref, { coverage: 'suspended', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { coverage: 'active' }));
    await assertFails(updateDoc(ref, { type: 'zone', parentCityId: 'quito', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { createdAt: 5, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { location: { lat: -100, lng: 0 }, updatedAt: serverTimestamp() }));
  });

  it('denies client deletes (the deleteCity callable checks routes and zones)', async () => {
    await assertFails(deleteDoc(doc(cityManager(), 'cities', 'loja')));
    await assertFails(deleteDoc(doc(admin(), 'cities', 'loja')));
  });
});

function validCity(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'Quito',
    province: 'Pichincha',
    country: 'EC',
    type: 'city',
    location: { lat: -0.1807, lng: -78.4678 },
    coverage: 'planned',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function validZone(overrides: Record<string, unknown> = {}) {
  return validCity({ name: 'Centro', province: 'Loja', type: 'zone', parentCityId: 'loja', ...overrides });
}

describe('roles/{id}', () => {
  it('lets signed-in users read roles but not anonymous visitors', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'roles', 'runner')));
    await assertFails(getDoc(doc(anon(), 'roles', 'runner')));
  });

  it('denies every client write, even to admins (the role callables write them)', async () => {
    await assertFails(setDoc(doc(alice(), 'roles', 'runner'), { name: 'Corredor' }));
    await assertFails(setDoc(doc(admin(), 'roles', 'support'), { name: 'Soporte', permissions: [] }));
    await assertFails(setDoc(doc(roleManager(), 'roles', 'support'), { name: 'Soporte', permissions: [] }));
    await assertFails(deleteDoc(doc(admin(), 'roles', 'runner')));
  });
});

describe('permission claims (perms)', () => {
  it('lets a user with users.read read any user doc', async () => {
    await assertSucceeds(getDoc(doc(userReader(), 'users', ALICE)));
  });

  it('denies reading users without users.read', async () => {
    await assertFails(getDoc(doc(roleManager(), 'users', ALICE)));
    const runner = testEnv.authenticatedContext(BOB, { role: 'runner', perms: [] }).firestore();
    await assertFails(getDoc(doc(runner, 'users', ALICE)));
  });

  it('does not let users.read write other users', async () => {
    await assertFails(updateDoc(doc(userReader(), 'users', ALICE), { firstName: 'X', updatedAt: serverTimestamp() }));
  });
});

describe('default deny', () => {
  it('denies unknown collections even to admins', async () => {
    await assertFails(getDoc(doc(admin(), 'anything', 'x')));
    await assertFails(setDoc(doc(alice(), 'anything', 'x'), { a: 1 }));
  });
});
