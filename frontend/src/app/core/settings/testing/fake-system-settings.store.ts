import { signal } from '@angular/core';
import { vi } from 'vitest';
import { DEFAULT_SETTINGS, SystemSettings } from '../system-settings';
import { SystemSettingsStore } from '../system-settings.store';

/** A `SystemSettingsStore` that answers the defaults with some values overridden, no HTTP. */
export function fakeSystemSettingsStore(overrides: Partial<SystemSettings> = {}) {
  const current = signal<SystemSettings>({ ...DEFAULT_SETTINGS, ...overrides });
  return {
    settings: current.asReadonly(),
    load: vi.fn(async () => undefined),
    /** Replaces the values in a running test, as a reload would. */
    use: (changes: Partial<SystemSettings>) => current.set({ ...DEFAULT_SETTINGS, ...changes }),
  };
}

export type FakeSystemSettingsStore = ReturnType<typeof fakeSystemSettingsStore>;

export const provideSystemSettings = (store: FakeSystemSettingsStore = fakeSystemSettingsStore()) => ({
  provide: SystemSettingsStore,
  useValue: store,
});
