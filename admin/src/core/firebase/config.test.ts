import { describe, expect, it } from 'vitest';

import { readFirebaseConfig } from './config';

describe('readFirebaseConfig', () => {
  it('defaults to the demo project and no emulators', () => {
    const config = readFirebaseConfig({});
    expect(config.options.projectId).toBe('demo-runcty');
    expect(config.useEmulators).toBe(false);
    expect(config.emulatorHost).toBe('127.0.0.1');
  });

  it('reads the public variables and the emulator flag', () => {
    const config = readFirebaseConfig({
      apiKey: 'key',
      projectId: 'runcty-prod',
      useEmulators: 'true',
      emulatorHost: '192.168.1.20',
    });
    expect(config.options).toMatchObject({ apiKey: 'key', projectId: 'runcty-prod' });
    expect(config.useEmulators).toBe(true);
    expect(config.emulatorHost).toBe('192.168.1.20');
  });

  it('only enables emulators with the exact value "true"', () => {
    expect(readFirebaseConfig({ useEmulators: 'yes' }).useEmulators).toBe(false);
  });
});
