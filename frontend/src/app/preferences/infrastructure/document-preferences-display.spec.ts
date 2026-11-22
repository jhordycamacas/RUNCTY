import { SystemBarsStyle } from '@capacitor/core';
import { defaultPreferences } from '../domain/preferences';
import { DocumentPreferencesDisplay, systemBarsStyleFor } from './document-preferences-display';

describe('systemBarsStyleFor', () => {
  it('gives light icons on the dark theme and dark icons on the light theme', () => {
    expect(systemBarsStyleFor('dark')).toBe(SystemBarsStyle.Dark);
    expect(systemBarsStyleFor('light')).toBe(SystemBarsStyle.Light);
  });

  it('lets the device decide when the theme follows the system', () => {
    expect(systemBarsStyleFor('system')).toBe(SystemBarsStyle.Default);
  });
});

describe('DocumentPreferencesDisplay', () => {
  const display = new DocumentPreferencesDisplay();
  let root: HTMLElement;

  beforeEach(() => (root = document.createElement('html')));

  it('forces the dark and light themes', () => {
    display.apply({ ...defaultPreferences(), appearance: 'dark' }, root);
    expect(root.getAttribute('data-theme')).toBe('dark');

    display.apply({ ...defaultPreferences(), appearance: 'light' }, root);
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('marks the theme as "system" so the stylesheet follows the device', () => {
    display.apply({ ...defaultPreferences(), appearance: 'dark' }, root);

    display.apply({ ...defaultPreferences(), appearance: 'system' }, root);

    expect(root.getAttribute('data-theme')).toBe('system');
  });

  it('scales the root font size through the token', () => {
    display.apply({ ...defaultPreferences(), fontScale: 'xlarge' }, root);
    expect(root.style.getPropertyValue('--rc-font-scale')).toBe('1.3');

    display.apply({ ...defaultPreferences(), fontScale: 'small' }, root);
    expect(root.style.getPropertyValue('--rc-font-scale')).toBe('0.9');
  });
});
