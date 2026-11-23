import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferencesStore } from '../preferences/application/preferences.store';
import { Preferences, defaultPreferences } from '../preferences/domain/preferences';
import { ToastService } from '../shared/ui/toast.service';
import { ThemeSelector } from './theme-selector';

describe('ThemeSelector', () => {
  let fixture: ComponentFixture<ThemeSelector>;
  let current: ReturnType<typeof signal<Preferences>>;
  let save: ReturnType<typeof vi.fn<PreferencesStore['save']>>;
  let error: ReturnType<typeof vi.fn<ToastService['error']>>;

  const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const icon = () => (button().querySelector('ion-icon') as unknown as { name: string }).name;
  const press = async () => {
    button().click();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const appearance = (value: Preferences['appearance']) => {
    current.set({ ...defaultPreferences(), appearance: value });
    fixture.detectChanges();
  };

  beforeEach(() => {
    current = signal(defaultPreferences());
    save = vi.fn<PreferencesStore['save']>().mockResolvedValue(undefined);
    error = vi.fn<ToastService['error']>().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: PreferencesStore, useValue: { preferences: current.asReadonly(), save } },
        { provide: ToastService, useValue: { error } },
      ],
    });
    fixture = TestBed.createComponent(ThemeSelector);
    fixture.detectChanges();
  });

  it('is one icon button: a sun on the dark theme, a moon on the light one', () => {
    expect(icon()).toBe('sunny-outline');
    appearance('light');
    expect(icon()).toBe('moon-outline');
  });

  it('names the action for assistive technology, not the current theme', () => {
    expect(button().getAttribute('aria-label')).toBe('Cambiar a tema claro');
    appearance('light');
    expect(button().getAttribute('aria-label')).toBe('Cambiar a tema oscuro');
  });

  it('switches to the opposite theme keeping the rest of the preferences', async () => {
    await press();
    expect(save).toHaveBeenLastCalledWith({ ...defaultPreferences(), appearance: 'light' });

    appearance('light');
    await press();
    expect(save).toHaveBeenLastCalledWith({ ...defaultPreferences(), appearance: 'dark' });
  });

  it('resolves the system appearance to what the device shows before switching', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query.includes('dark') })) as never;
    try {
      appearance('system');
      expect(icon()).toBe('sunny-outline');
      await press();
      expect(save).toHaveBeenLastCalledWith({ ...defaultPreferences(), appearance: 'light' });
    } finally {
      window.matchMedia = original;
    }
  });

  it('tells the failure and keeps the saved theme', async () => {
    save.mockRejectedValueOnce(new Error('boom'));

    await press();

    expect(error).toHaveBeenCalledTimes(1);
    expect(icon()).toBe('sunny-outline');
  });
});
