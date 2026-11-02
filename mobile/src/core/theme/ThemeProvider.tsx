import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type ColorScheme, type Theme } from './themes';

const ThemeContext = createContext<Theme>(lightTheme);

interface ThemeProviderProps {
  children: ReactNode;
  /** Forces a scheme (user preference). Defaults to the system scheme. */
  scheme?: ColorScheme;
  fontScale?: number;
}

export function ThemeProvider({ children, scheme, fontScale = 1 }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const resolved: ColorScheme = scheme ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const theme = useMemo<Theme>(() => {
    const baseTheme = resolved === 'dark' ? darkTheme : lightTheme;
    return { ...baseTheme, fontScale };
  }, [resolved, fontScale]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
