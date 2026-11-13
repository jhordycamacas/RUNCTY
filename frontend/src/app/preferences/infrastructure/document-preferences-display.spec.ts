import { defaultPreferences } from '../domain/preferences';
import { DocumentPreferencesDisplay } from './document-preferences-display';

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

  it('follows the system again when the appearance is "system"', () => {
    display.apply({ ...defaultPreferences(), appearance: 'dark' }, root);

    display.apply(defaultPreferences(), root);

    expect(root.hasAttribute('data-theme')).toBe(false);
  });

  it('scales the root font size through the token', () => {
    display.apply({ ...defaultPreferences(), fontScale: 'xlarge' }, root);
    expect(root.style.getPropertyValue('--rc-font-scale')).toBe('1.3');

    display.apply({ ...defaultPreferences(), fontScale: 'small' }, root);
    expect(root.style.getPropertyValue('--rc-font-scale')).toBe('0.9');
  });
});
