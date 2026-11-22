import { Injectable } from '@angular/core';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import {
  Appearance,
  Preferences,
  PreferencesDisplay,
  fontScaleMultiplier,
} from '../domain/preferences';

/**
 * Style of the system bar icons for an appearance. The app draws behind the bars (edge-to-edge),
 * so the icons must contrast with the page: `Dark` means light icons on a dark page, `Light` dark
 * icons on a light page, and `Default` follows the device like the `system` theme does.
 */
export function systemBarsStyleFor(appearance: Appearance): SystemBarsStyle {
  switch (appearance) {
    case 'dark':
      return SystemBarsStyle.Dark;
    case 'light':
      return SystemBarsStyle.Light;
    default:
      return SystemBarsStyle.Default;
  }
}

/**
 * Applies the display preferences to `<html>`: `data-theme` is `light`, `dark` or `system` (follow the
 * device; absent means light, see theme/_tokens.scss) and `--rc-font-scale` scales the root font size.
 * On the phone it also sets the status and gesture bar icons to contrast with the theme.
 */
@Injectable()
export class DocumentPreferencesDisplay extends PreferencesDisplay {
  apply(preferences: Preferences, root: HTMLElement = document.documentElement): void {
    root.setAttribute('data-theme', preferences.appearance);
    root.style.setProperty('--rc-font-scale', String(fontScaleMultiplier(preferences.fontScale)));
    if (Capacitor.isNativePlatform()) {
      // The icon color is cosmetic: a failure must never break applying the theme.
      SystemBars.setStyle({ style: systemBarsStyleFor(preferences.appearance) }).catch(
        () => undefined,
      );
    }
  }
}
