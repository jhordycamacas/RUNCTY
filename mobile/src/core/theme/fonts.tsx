import { createContext, useContext, type ReactNode } from 'react';
import type { TextStyle } from 'react-native';

import { fontFamilies, fontWeights, type FontWeightToken } from './tokens';

/** Whether the Inter families finished loading; true by default (and in tests). */
const CustomFontsContext = createContext(true);

/**
 * Turns the Inter families off when they failed to load, so text falls back to
 * the system font with a regular `fontWeight` instead of a missing family.
 */
export function CustomFontsProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <CustomFontsContext.Provider value={enabled}>{children}</CustomFontsContext.Provider>;
}

export function typefaceFor(
  weight: FontWeightToken,
  customFonts: boolean,
): Pick<TextStyle, 'fontFamily' | 'fontWeight'> {
  // Each Inter weight is its own family; adding fontWeight on top makes
  // Android synthesize a fake bold, so it is only set for the system font.
  return customFonts ? { fontFamily: fontFamilies[weight] } : { fontWeight: fontWeights[weight] };
}

/** Text style (family or weight) for a weight token, honoring font availability. */
export function useTypeface(weight: FontWeightToken): Pick<TextStyle, 'fontFamily' | 'fontWeight'> {
  return typefaceFor(weight, useContext(CustomFontsContext));
}
