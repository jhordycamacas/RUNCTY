import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/app/providers';
import { RootNavigator } from '@/app/navigation/RootNavigator';
import { CustomFontsProvider } from '@/core/theme';
import { LoadingView } from '@/core/ui';
// Initializes Firebase (and emulator connections) once at startup.
import '@/core/firebase';

export default function App() {
  // Keys must match `fontFamilies` in core/theme/tokens.ts.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <CustomFontsProvider enabled={false}>
        <LoadingView label="Preparando RUNCTY…" />
      </CustomFontsProvider>
    );
  }

  return (
    // If Inter failed to load, fall back to the system font instead of blocking the app.
    <CustomFontsProvider enabled={fontsLoaded}>
      <AppProviders>
        <StatusBar style="auto" />
        <RootNavigator />
      </AppProviders>
    </CustomFontsProvider>
  );
}
