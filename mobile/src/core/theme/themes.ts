import { elevation, fontFamilies, fontSizes, fontWeights, palette, radii, spacing } from './tokens';

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  /** Cards and sheets that sit above `background` (paired with elevation). */
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  /** Fill color for primary actions. Always paired with `onPrimary` text. */
  primary: string;
  primaryPressed: string;
  /** Light tint for selected/highlighted backgrounds. */
  primaryTint: string;
  onPrimary: string;
  /** Brand red when used as text or icon color on `background`. */
  primaryText: string;
  success: string;
  warning: string;
  danger: string;
  /** Soft backgrounds for badges and callouts; text uses the matching tone. */
  successTint: string;
  warningTint: string;
  dangerTint: string;
  /** Safety index levels (Alto / Medio / Bajo), used from Sprint 2. */
  safetyHigh: string;
  safetyMedium: string;
  safetyLow: string;
}

export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: {
    sizes: typeof fontSizes;
    weights: typeof fontWeights;
    families: typeof fontFamilies;
  };
  elevation: typeof elevation;
  /** User font-size preference multiplier (1 = default). */
  fontScale: number;
}

const base = {
  spacing,
  radii,
  typography: { sizes: fontSizes, weights: fontWeights, families: fontFamilies },
  elevation,
  fontScale: 1,
};

export const lightTheme: Theme = {
  ...base,
  scheme: 'light',
  colors: {
    background: palette.white,
    surface: palette.grey50,
    surfaceElevated: palette.white,
    border: palette.grey300,
    text: palette.black,
    textMuted: palette.grey600,
    primary: palette.red600,
    primaryPressed: palette.red700,
    primaryTint: palette.red100,
    onPrimary: palette.white,
    primaryText: palette.red600,
    success: palette.green600,
    warning: palette.amber700,
    danger: palette.red600,
    successTint: palette.green50,
    warningTint: palette.amber50,
    dangerTint: palette.red50,
    safetyHigh: palette.green600,
    safetyMedium: palette.amber700,
    safetyLow: palette.red600,
  },
};

export const darkTheme: Theme = {
  ...base,
  scheme: 'dark',
  colors: {
    background: palette.black,
    surface: palette.grey900,
    surfaceElevated: palette.grey900,
    border: palette.grey800,
    text: palette.white,
    textMuted: palette.grey400,
    primary: palette.red600,
    primaryPressed: palette.red700,
    primaryTint: palette.grey800,
    onPrimary: palette.white,
    primaryText: palette.red300,
    success: palette.green300,
    warning: palette.amber300,
    danger: palette.red400,
    successTint: palette.green900,
    warningTint: palette.amber900,
    dangerTint: palette.red900,
    safetyHigh: palette.green300,
    safetyMedium: palette.amber300,
    safetyLow: palette.red400,
  },
};
