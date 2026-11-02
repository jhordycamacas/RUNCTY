import { createTheme, resolveColorScheme } from '@/core/theme/resolveTheme';
import { darkTheme, lightTheme } from '@/core/theme/themes';

describe('resolveColorScheme', () => {
  it('follows the device scheme when the appearance is system', () => {
    expect(resolveColorScheme('system', 'dark')).toBe('dark');
    expect(resolveColorScheme('system', 'light')).toBe('light');
  });

  it('falls back to light when the device scheme is unknown', () => {
    expect(resolveColorScheme('system', null)).toBe('light');
    expect(resolveColorScheme('system', undefined)).toBe('light');
  });

  it('forces the chosen appearance regardless of the device', () => {
    expect(resolveColorScheme('dark', 'light')).toBe('dark');
    expect(resolveColorScheme('light', 'dark')).toBe('light');
  });
});

describe('createTheme', () => {
  it('uses the palette of the scheme and applies the font scale', () => {
    const theme = createTheme('dark', 1.3);
    expect(theme.colors).toEqual(darkTheme.colors);
    expect(theme.scheme).toBe('dark');
    expect(theme.fontScale).toBe(1.3);
    expect(createTheme('light', 0.9).colors).toEqual(lightTheme.colors);
  });
});
