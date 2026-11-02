/**
 * Design tokens. Raw palette values live here; components consume the
 * semantic colors exposed by the active theme (see themes.ts).
 */
export const palette = {
  white: '#FFFFFF',
  black: '#111111',

  // Brand soft red. red500 is the brand tone but only reaches 3.96:1 with
  // white, so filled controls use red600/red700 to keep text at >= 4.5:1.
  red100: '#FBE9E8',
  red300: '#E8807C',
  red400: '#F08A86',
  red500: '#D9534F',
  red600: '#C9302C',
  red700: '#A8322E',

  grey50: '#F7F7F7',
  grey100: '#EFEFEF',
  grey300: '#D4D4D4',
  grey400: '#A3A3A3',
  grey600: '#5F5F5F',
  grey800: '#2A2A2C',
  grey900: '#1C1C1E',

  green600: '#2E7D32',
  green300: '#81C784',
  amber700: '#8A5300',
  amber300: '#FFB74D',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

/** Minimum touch target (RNF: buttons >= 48 dp). */
export const MIN_TOUCH_TARGET = 48;

export const fontSizes = {
  caption: 12,
  body: 16,
  label: 14,
  subtitle: 18,
  title: 24,
  display: 32,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  bold: '700',
} as const;

export type FontSizeToken = keyof typeof fontSizes;
