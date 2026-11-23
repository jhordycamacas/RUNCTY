import { SETTING_FIELDS, SETTING_GROUPS } from './settings-fields';
import { DEFAULT_SETTINGS } from '../../../core/settings/system-settings';
import { recalculatedMessage } from './system-settings';

describe('system settings domain', () => {
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
