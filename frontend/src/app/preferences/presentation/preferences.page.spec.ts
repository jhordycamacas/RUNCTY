import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiError } from '../../core/errors/api-error';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { PreferencesStore } from '../application/preferences.store';
import { Preferences, defaultPreferences } from '../domain/preferences';
import { PreferencesPage } from './preferences.page';

describe('PreferencesPage', () => {
  let fixture: ComponentFixture<PreferencesPage>;
  let current: ReturnType<typeof signal<Preferences>>;
  let loaded: ReturnType<typeof signal<boolean>>;
  let failure: ReturnType<typeof signal<string | null>>;
  let store: {
    preferences: ReturnType<typeof signal<Preferences>>;
    loaded: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    load: ReturnType<typeof vi.fn<() => Promise<void>>>;
    save: ReturnType<typeof vi.fn<(value: Preferences) => Promise<void>>>;
    reset: ReturnType<typeof vi.fn<() => Promise<void>>>;
  };
  let confirm: ReturnType<typeof vi.fn<ConfirmDialog['confirm']>>;

  const text = () => fixture.nativeElement.textContent as string;
  const page = () => fixture.componentInstance;
  async function settle(): Promise<void> {
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }
  async function create(): Promise<void> {
    fixture = TestBed.createComponent(PreferencesPage);
    fixture.detectChanges();
    await settle();
  }

  beforeEach(() => {
    current = signal(defaultPreferences());
    loaded = signal(false);
    failure = signal(null);
    store = {
      preferences: current,
      loaded,
      error: failure,
      load: vi.fn<() => Promise<void>>().mockImplementation(async () => loaded.set(true)),
      save: vi
        .fn<(value: Preferences) => Promise<void>>()
        .mockImplementation(async (value) => current.set(value)),
      reset: vi
        .fn<() => Promise<void>>()
        .mockImplementation(async () => current.set(defaultPreferences())),
    };
    confirm = vi.fn<ConfirmDialog['confirm']>().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PreferencesStore, useValue: store },
        { provide: ConfirmDialog, useValue: { confirm } },
      ],
    });
  });

  it('shows the current preferences and has nothing to save yet', async () => {
    await create();

    expect(page()['draft']()).toEqual(defaultPreferences());
    expect(page().hasUnsavedChanges()).toBe(false);
  });

  it('marks the groups that do not do anything yet as coming soon', async () => {
    await create();

    const soon = Array.from(
      fixture.nativeElement.querySelectorAll('.soon') as NodeListOf<HTMLElement>,
    );
    expect(soon.map((el) => el.closest('fieldset')?.querySelector('legend')?.textContent)).toEqual([
      expect.stringContaining('Notificaciones'),
      expect.stringContaining('Privacidad de ubicación'),
    ]);
  });

  it('keeps the draft when the preferences are refreshed behind the screen', async () => {
    await create();
    page()['update']({ appearance: 'dark', fontScale: 'xlarge' });

    current.set({ ...defaultPreferences(), units: 'imperial' });
    await page()['load']();
    await settle();

    expect(page()['draft']()).toMatchObject({
      appearance: 'dark',
      fontScale: 'xlarge',
      units: 'metric',
    });
    expect(page().hasUnsavedChanges()).toBe(true);
  });

  it('saves the draft, confirms it and keeps the same form (no remount)', async () => {
    await create();
    const content = fixture.nativeElement.querySelector('ion-content');
    page()['update']({ appearance: 'dark' });

    await page()['save']();
    await settle();

    expect(store.save).toHaveBeenCalledWith({ ...defaultPreferences(), appearance: 'dark' });
    expect(text()).toContain('Preferencias guardadas.');
    expect(page().hasUnsavedChanges()).toBe(false);
    expect(fixture.nativeElement.querySelector('ion-content')).toBe(content);
  });

  it('turns the other notification switches off with the main one', async () => {
    await create();

    page()['updateNotifications']({ enabled: false });

    expect(page()['draft']()?.notifications).toEqual({
      enabled: false,
      safetyAlerts: true,
      events: true,
    });
  });

  it('shows the error of a failed save and keeps the draft', async () => {
    await create();
    page()['update']({ units: 'imperial' });
    store.save.mockRejectedValueOnce(
      new ApiError(0, 'network', 'No hay conexión con el servidor.'),
    );

    await page()['save']();
    await settle();

    expect(text()).toContain('No hay conexión con el servidor.');
    expect(page()['draft']()?.units).toBe('imperial');
  });

  it('asks before restoring the defaults', async () => {
    current.set({ ...defaultPreferences(), appearance: 'dark' });
    await create();

    await page()['reset']();
    await settle();

    expect(confirm).toHaveBeenCalledOnce();
    expect(store.reset).toHaveBeenCalledOnce();
    expect(page()['draft']()).toEqual(defaultPreferences());
    expect(text()).toContain('Se restablecieron los valores predeterminados.');
  });

  it('does not reset when the user cancels', async () => {
    await create();
    confirm.mockResolvedValue(false);

    await page()['reset']();

    expect(store.reset).not.toHaveBeenCalled();
  });

  it('shows a load failure with a retry', async () => {
    store.load.mockImplementation(async () => failure.set('No hay conexión con el servidor.'));
    await create();

    expect(text()).toContain('No hay conexión con el servidor.');
    expect(text()).toContain('Reintentar');
    expect(page()['draft']()).toBeNull();

    failure.set(null);
    store.load.mockImplementation(async () => loaded.set(true));
    await page()['load']();
    await settle();

    expect(page()['draft']()).toEqual(defaultPreferences());
  });
});
