import { describe, expect, it } from 'vitest';

import { checkSeedTarget } from './seedGuard';

const ok = {
  projectId: 'demo-runcty',
  firestoreHost: '127.0.0.1:8080',
  authHost: '127.0.0.1:9099',
};

describe('checkSeedTarget', () => {
  it('accepts loopback hosts and the Docker service host with a demo project', () => {
    expect(checkSeedTarget(ok)).toBeNull();
    expect(checkSeedTarget({ ...ok, firestoreHost: 'localhost:8080', authHost: '[::1]:9099' })).toBeNull();
    expect(checkSeedTarget({ ...ok, firestoreHost: 'firebase:8080', authHost: 'firebase:9099' })).toBeNull();
  });

  it('refuses missing emulator hosts', () => {
    expect(checkSeedTarget({ ...ok, firestoreHost: undefined })).toMatch(/EMULATOR_HOST/);
    expect(checkSeedTarget({ ...ok, authHost: '' })).toMatch(/EMULATOR_HOST/);
  });

  it('refuses a project id that is not a demo project', () => {
    expect(checkSeedTarget({ ...ok, projectId: 'runcty-prod' })).toMatch(/demo-/);
    expect(checkSeedTarget({ ...ok, projectId: undefined })).toMatch(/demo-/);
  });

  it('refuses remote hosts, including lookalikes', () => {
    expect(checkSeedTarget({ ...ok, firestoreHost: 'firestore.googleapis.com:443' })).toMatch(/loopback/);
    expect(checkSeedTarget({ ...ok, authHost: '10.0.0.5:9099' })).toMatch(/loopback/);
    expect(checkSeedTarget({ ...ok, authHost: '127.0.0.1.evil.com:9099' })).toMatch(/loopback/);
  });
});
