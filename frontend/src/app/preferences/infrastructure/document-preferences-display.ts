import { Injectable } from '@angular/core';
import { Preferences, PreferencesDisplay, fontScaleMultiplier } from '../domain/preferences';

/**
 * Applies the display preferences to `<html>`: `data-theme` forces light or dark (absent means
 * "follow the system", see theme/_tokens.scss) and `--rc-font-scale` scales the root font size.
 */
@Injectable()
export class DocumentPreferencesDisplay extends PreferencesDisplay {
  apply(preferences: Preferences, root: HTMLElement = document.documentElement): void {
    if (preferences.appearance === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', preferences.appearance);
    root.style.setProperty('--rc-font-scale', String(fontScaleMultiplier(preferences.fontScale)));
  }
}
