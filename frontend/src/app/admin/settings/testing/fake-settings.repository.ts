import { vi } from 'vitest';
import { DEFAULT_SETTINGS, SettingsRepository } from '../domain/system-settings';

/** Every port method as a mock, answering the defaults unless a test says otherwise. */
export function fakeSettingsRepository() {
  return {
    load: vi.fn<SettingsRepository['load']>().mockResolvedValue({ ...DEFAULT_SETTINGS }),
    save: vi
      .fn<SettingsRepository['save']>()
      .mockImplementation(async (changes) => ({
        settings: { ...DEFAULT_SETTINGS, ...changes },
        recalculated: 0,
      })),
    recalculateRoutes: vi.fn<SettingsRepository['recalculateRoutes']>().mockResolvedValue(0),
  };
}

export type FakeSettingsRepository = ReturnType<typeof fakeSettingsRepository>;

/** Lets pending promises and the renders they trigger settle. */
export async function settle(fixture: { detectChanges(): void }): Promise<void> {
  for (let i = 0; i < 6; i += 1) {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }
}
