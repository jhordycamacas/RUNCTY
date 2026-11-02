import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { createTheme, resolveColorScheme, type Appearance } from './resolveTheme';
import { lightTheme, type Theme } from './themes';

const ThemeContext = createContext<Theme>(lightTheme);

interface ThemeProviderProps {
  children: ReactNode;
  /** User preference. Defaults to the device scheme. */
  appearance?: Appearance;
  /** Font-size multiplier (1 = default). */
  fontScale?: number;
}

export function ThemeProvider({ children, appearance = 'system', fontScale = 1 }: ThemeProviderProps) {
  const deviceScheme = useColorScheme();
  const scheme = resolveColorScheme(appearance, deviceScheme);
  const theme = useMemo(() => createTheme(scheme, fontScale), [scheme, fontScale]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
