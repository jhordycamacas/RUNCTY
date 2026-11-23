import { SETTING_FIELDS, SETTING_GROUPS } from './settings-fields';
import { DEFAULT_SETTINGS, recalculatedMessage, toSystemSettings } from './system-settings';

describe('system settings domain', () => {
  it('reads a complete body as it is', () => {
    const body = { ...DEFAULT_SETTINGS, penaltyHigh: 50, timeZone: 'America/Lima' };

    expect(toSystemSettings(body)).toEqual(body);
  });

  it('gives every missing or malformed parameter its default', () => {
    const read = toSystemSettings({ penaltyLow: 'x', thresholdHigh: 80, timeZone: '', countryCode: 5 });

    expect(read).toEqual({ ...DEFAULT_SETTINGS, thresholdHigh: 80 });
    expect(toSystemSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('shows every parameter in exactly one group of the page', () => {
    const shown = SETTING_GROUPS.flatMap((group) => group.fields.map((field) => field.key));

    expect([...shown].sort()).toEqual(Object.keys(DEFAULT_SETTINGS).sort());
    expect(SETTING_FIELDS.size).toBe(shown.length);
  });

  it('words the recalculation with the plural of routes', () => {
    expect(recalculatedMessage(1)).toBe('Se recalculó el índice de 1 ruta');
    expect(recalculatedMessage(12)).toBe('Se recalculó el índice de 12 rutas');
  });
});
