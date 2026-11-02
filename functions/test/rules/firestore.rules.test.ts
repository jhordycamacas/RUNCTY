import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const PROJECT_ID = 'demo-runcty';
const ALICE = 'alice';
const BOB = 'bob';
const ADMIN = 'admin-1';

let testEnv: RulesTestEnvironment;

const aliceDoc = { uid: ALICE, email: 'alice@runcty.dev', firstName: 'Alice', createdAt: 1 };

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
const bob = () => testEnv.authenticatedContext(BOB).firestore();
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

  it('lets a user create their own doc without a role', async () => {
    await assertSucceeds(setDoc(doc(bob(), 'users', BOB), { uid: BOB, email: 'bob@runcty.dev' }));
  });

  it('denies creating a doc that sets a role', async () => {
    await assertFails(setDoc(doc(bob(), 'users', BOB), { uid: BOB, role: 'admin' }));
  });

  it('denies creating a doc for another uid', async () => {
    await assertFails(setDoc(doc(bob(), 'users', ALICE), { uid: ALICE }));
    await assertFails(setDoc(doc(bob(), 'users', BOB), { uid: ALICE }));
  });

  it('lets the owner update profile fields', async () => {
    await assertSucceeds(updateDoc(doc(alice(), 'users', ALICE), { firstName: 'Alicia' }));
  });

  it('denies the owner modifying role, uid, email or createdAt', async () => {
    const ref = doc(alice(), 'users', ALICE);
    await assertFails(updateDoc(ref, { role: 'admin' }));
    await assertFails(updateDoc(ref, { uid: BOB }));
    await assertFails(updateDoc(ref, { email: 'other@runcty.dev' }));
    await assertFails(updateDoc(ref, { createdAt: 2 }));
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
    await assertFails(setDoc(doc(bob(), 'users', ALICE, 'private', 'sportProfile'), { level: 'pro' }));
  });
});

describe('cities/{id}', () => {
  it('lets signed-in users read cities and denies anonymous reads', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'cities', 'loja')));
    await assertFails(getDoc(doc(anon(), 'cities', 'loja')));
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
