import { describe, expect, it } from 'vitest';

import { isAppCheckEnforced } from './appCheck';

describe('isAppCheckEnforced', () => {
  it('is off by default so the emulators and the demo keep working', () => {
    expect(isAppCheckEnforced({})).toBe(false);
    expect(isAppCheckEnforced({ ENFORCE_APP_CHECK: 'false' })).toBe(false);
    expect(isAppCheckEnforced({ ENFORCE_APP_CHECK: '1' })).toBe(false);
  });

  it('turns on only with the exact string "true"', () => {
    expect(isAppCheckEnforced({ ENFORCE_APP_CHECK: 'true' })).toBe(true);
  });
});
