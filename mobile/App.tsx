import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/app/providers';
import { RootNavigator } from '@/app/navigation/RootNavigator';
// Initializes Firebase (and emulator connections) once at startup.
import '@/core/firebase';

export default function App() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <RootNavigator />
    </AppProviders>
  );
}
