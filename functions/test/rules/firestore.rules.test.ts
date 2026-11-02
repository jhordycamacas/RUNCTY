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
    await setDoc(doc(ctx.firestore(), 'cities', 'loja'), { name: 'Loja' });
  });
});

const alice = () => testEnv.authenticatedContext(ALICE).firestore();
const BOB_EMAIL = 'bob@runcty.dev';
const bob = () => testEnv.authenticatedContext(BOB, { email: BOB_EMAIL }).firestore();
const admin = () => testEnv.authenticatedContext(ADMIN, { role: 'admin' }).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

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
  it('lets the owner read and write private docs', async () => {
    const ref = doc(alice(), 'users', ALICE, 'private', 'preferences');
    await assertSucceeds(setDoc(ref, { darkMode: true }));
    await assertSucceeds(getDoc(ref));
  });

  it('denies other users', async () => {
    await assertFails(getDoc(doc(bob(), 'users', ALICE, 'private', 'preferences')));
    await assertFails(setDoc(doc(bob(), 'users', ALICE, 'private', 'sportProfile'), validSportProfile()));
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

  it('denies non-admin writes', async () => {
    await assertFails(setDoc(doc(alice(), 'cities', 'quito'), { name: 'Quito' }));
  });

  it('allows admin writes', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'cities', 'quito'), { name: 'Quito' }));
  });
});

describe('roles/{id}', () => {
  it('lets signed-in users read and only admins write', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'roles', 'runner')));
    await assertFails(setDoc(doc(alice(), 'roles', 'runner'), { name: 'Corredor' }));
    await assertSucceeds(setDoc(doc(admin(), 'roles', 'runner'), { name: 'Corredor' }));
  });
});

describe('default deny', () => {
  it('denies unknown collections even to admins', async () => {
    await assertFails(getDoc(doc(admin(), 'anything', 'x')));
    await assertFails(setDoc(doc(alice(), 'anything', 'x'), { a: 1 }));
  });
});
