import { darkTheme, lightTheme, type ColorScheme, type Theme } from './themes';

/** User appearance choice; `system` follows the device. */
export type Appearance = 'system' | 'light' | 'dark';

export function resolveColorScheme(appearance: Appearance, deviceScheme: string | null | undefined): ColorScheme {
  if (appearance !== 'system') return appearance;
  return deviceScheme === 'dark' ? 'dark' : 'light';
}

export function createTheme(scheme: ColorScheme, fontScale: number): Theme {
  const base = scheme === 'dark' ? darkTheme : lightTheme;
  return { ...base, fontScale };
}
