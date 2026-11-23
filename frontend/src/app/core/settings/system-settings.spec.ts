import { DEFAULT_SETTINGS, toSystemSettings } from './system-settings';

describe('system settings', () => {
  it('reads a complete body as it is', () => {
    const body = { ...DEFAULT_SETTINGS, penaltyHigh: 50, timeZone: 'America/Lima' };

    expect(toSystemSettings(body)).toEqual(body);
  });

  it('gives every missing or malformed parameter its default', () => {
    const read = toSystemSettings({ penaltyLow: 'x', thresholdHigh: 80, timeZone: '', countryCode: 5 });

    expect(read).toEqual({ ...DEFAULT_SETTINGS, thresholdHigh: 80 });
    expect(toSystemSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
});
