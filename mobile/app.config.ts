import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Expo app config. Values that change per environment come from env vars;
 * Firebase keys are read at runtime from EXPO_PUBLIC_* (see src/core/firebase).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'RUNCTY',
  slug: 'runcty',
  scheme: 'runcty',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'ec.utpl.runcty',
    supportsTablet: false,
  },
  android: {
    package: 'ec.utpl.runcty',
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
});
