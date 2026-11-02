/**
 * The `firebase/auth` typings resolve to the browser build, which hides the
 * React Native-only export. Metro resolves the RN build at runtime (the
 * `react-native` export condition), so only the type needs declaring.
 */
import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
