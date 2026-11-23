import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CatalogRepository } from '../../core/catalogs/catalog';
import {
  FakeCatalogRepository,
  fakeCatalogRepository,
} from '../../core/catalogs/testing/fake-catalog.repository';
import { ApiError } from '../../core/errors/api-error';
import { DEFAULT_SETTINGS, SystemSettings } from '../../core/settings/system-settings';
import { SystemSettingsStore } from '../../core/settings/system-settings.store';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { TextField } from '../../shared/ui/text-field';
import { PreferencesStore } from '../../preferences/application/preferences.store';
import { Preferences, defaultPreferences } from '../../preferences/domain/preferences';
import { SportProfile, SportProfileRepository } from '../domain/sport-profile';
import { SportProfilePage } from './sport-profile.page';

const STORED: SportProfile = {
  level: 'intermediate',
  goals: ['racePrep', 'pace'],
  usualPaceSecPerKm: 345,
  preferredDistanceKm: 10.5,
};

describe('SportProfilePage', () => {
  let fixture: ComponentFixture<SportProfilePage>;
  let remote: SportProfile | null;
  let saved: SportProfile[];
  let removed: number;
  let confirm: ReturnType<typeof vi.fn<ConfirmDialog['confirm']>>;
  let saveFailure: unknown;
  let preferences: ReturnType<typeof signal<Preferences>>;
  let catalogs: FakeCatalogRepository;
  let settings: ReturnType<typeof signal<SystemSettings>>;

  const text = () => fixture.nativeElement.textContent as string;
  const page = () => fixture.componentInstance;
  async function settle(): Promise<void> {
    for (let i = 0; i < 4; i += 1) {
      await new Promise((resolve) => setTimeout(resolve));
      await fixture.whenStable();
      fixture.detectChanges();
    }
  }
  async function create(stored: SportProfile | null): Promise<void> {
    remote = stored;
    fixture = TestBed.createComponent(SportProfilePage);
    fixture.detectChanges();
    await settle();
  }
  async function submit(values: object): Promise<void> {
    page()['form'].reset({ level: '', goals: [], pace: '', distance: '', ...values });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await settle();
  }

  beforeEach(() => {
    saved = [];
    removed = 0;
    saveFailure = null;
    preferences = signal(defaultPreferences());
    catalogs = fakeCatalogRepository();
    settings = signal({ ...DEFAULT_SETTINGS });
    confirm = vi.fn<ConfirmDialog['confirm']>().mockResolvedValue(true);
    const repository: SportProfileRepository = {
      get: async () => remote,
      save: async (profile) => {
        if (saveFailure) throw saveFailure;
        saved.push(profile);
        return profile;
      },
      remove: async () => {
        removed += 1;
      },
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SportProfileRepository, useValue: repository },
        { provide: AuthService, useValue: { session: signal({ uid: 'u1' }) } },
        { provide: ConfirmDialog, useValue: { confirm } },
        { provide: PreferencesStore, useValue: { preferences } },
        { provide: CatalogRepository, useValue: catalogs },
        { provide: SystemSettingsStore, useValue: { settings, load: async () => undefined } },
      ],
    });
  });

  it('offers to create the profile when the user has none', async () => {
    await create(null);

    expect(text()).toContain('Crea tu perfil deportivo');
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });

  it('explains each invalid field and saves nothing', async () => {
    await create(null);

    await submit({ pace: '5', distance: 'diez' });

    expect(text()).toContain('Selecciona tu nivel.');
    expect(text()).toContain('Elige al menos un objetivo.');
    const fieldErrors = fixture.debugElement
      .queryAll(By.directive(TextField))
      .map((field) => field.componentInstance.error());
    expect(fieldErrors).toEqual([
      'Usa el formato min:seg, por ejemplo 6:30.',
      'Ingresa un número, por ejemplo 10.',
    ]);
    expect(saved).toEqual([]);
  });

  it('creates the profile and shows the summary with a notice', async () => {
    await create(null);

    await submit({
      level: 'intermediate',
      goals: ['racePrep', 'pace'],
      pace: '5:45',
      distance: '10,5',
    });

    expect(saved).toEqual([STORED]);
    expect(text()).toContain('Perfil deportivo guardado.');
    expect(text()).toContain('5:45 min/km');
    expect(text()).toContain('10,5 km');
    expect(text()).toContain('Intermedio');
  });

  it('shows the server error next to the button and keeps the form', async () => {
    await create(null);
    saveFailure = Object.assign(new Error('x'), { code: 'unavailable' });

    await submit({ level: 'beginner', goals: ['health'], pace: '7:00', distance: '5' });

    expect(text()).toContain('Ocurrió un error inesperado.');
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });

  it('shows the stored profile and edits it', async () => {
    await create(STORED);
    expect(text()).toContain('Editar perfil deportivo');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();

    (fixture.nativeElement.querySelector('.actions ion-button') as HTMLElement).click();
    await settle();

    expect(page()['form'].getRawValue()).toEqual({
      level: 'intermediate',
      goals: ['racePrep', 'pace'],
      pace: '5:45',
      distance: '10.5',
    });
    expect(page().hasUnsavedChanges()).toBe(false);

    page()['form'].controls.pace.setValue('6:00');
    expect(page().hasUnsavedChanges()).toBe(true);
  });

  it('shows the distance in the unit of the preferences', async () => {
    preferences.set({ ...defaultPreferences(), units: 'imperial' });

    await create(STORED);

    expect(text()).toContain('6,5 mi');
  });

  it('asks before deleting and goes back to the empty state', async () => {
    await create(STORED);

    await page()['remove']();
    await settle();

    expect(confirm).toHaveBeenCalledOnce();
    expect(removed).toBe(1);
    expect(text()).toContain('Perfil deportivo eliminado.');
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });

  it('deletes nothing when the user cancels', async () => {
    await create(STORED);
    confirm.mockResolvedValue(false);

    await page()['remove']();

    expect(removed).toBe(0);
  });

  it('shows a load failure with a retry instead of an empty form', async () => {
    remote = null;
    TestBed.overrideProvider(SportProfileRepository, {
      useValue: { get: () => Promise.reject({ code: 'x' }) },
    });
    fixture = TestBed.createComponent(SportProfilePage);
    fixture.detectChanges();
    await settle();

    expect(text()).toContain('Reintentar');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('offers the active options of the catalogs, with their labels', async () => {
    catalogs.list.mockImplementation(async (id) =>
      id === 'sportLevels'
        ? [
            { code: 'rookie', label: 'Novato', order: 1, active: true },
            { code: 'old', label: 'Antiguo', order: 2, active: false },
          ]
        : [{ code: 'fun', label: 'Divertirme', order: 1, active: true }],
    );

    await create(null);

    expect(text()).toContain('Novato');
    expect(text()).toContain('Divertirme');
    expect(text()).not.toContain('Antiguo');
    expect(text()).not.toContain('Principiante');
    expect(fixture.nativeElement.querySelectorAll('ion-radio')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('ion-checkbox')).toHaveLength(1);
  });

  it('saves a choice that comes from the catalog', async () => {
    catalogs.list.mockImplementation(async (id) =>
      id === 'sportLevels'
        ? [{ code: 'rookie', label: 'Novato', order: 1, active: true }]
        : [{ code: 'fun', label: 'Divertirme', order: 1, active: true }],
    );
    await create(null);

    await submit({ level: 'rookie', goals: ['fun'], pace: '6:00', distance: '5' });

    expect(saved).toEqual([
      { level: 'rookie', goals: ['fun'], usualPaceSecPerKm: 360, preferredDistanceKm: 5 },
    ]);
  });

  it('validates pace and distance against the ranges of the system settings', async () => {
    settings.set({ ...DEFAULT_SETTINGS, paceMinSecPerKm: 180, distanceMaxKm: 42 });
    await create(null);

    await submit({ level: 'beginner', goals: ['health'], pace: '2:30', distance: '43' });

    const fieldErrors = fixture.debugElement
      .queryAll(By.directive(TextField))
      .map((field) => field.componentInstance.error());
    expect(fieldErrors).toEqual([
      'El ritmo debe estar entre 3:00 y 20:00 min/km.',
      'La distancia debe estar entre 1 y 42 km.',
    ]);
    expect(saved).toEqual([]);
  });

  it('labels a stored choice that is no longer active, or shows its raw code', async () => {
    catalogs.list.mockImplementation(async (id) =>
      id === 'sportLevels'
        ? [{ code: 'old', label: 'Antiguo', order: 1, active: false }]
        : [{ code: 'fun', label: 'Divertirme', order: 1, active: true }],
    );

    await create({ ...STORED, level: 'old', goals: ['fun', 'ghost'] });

    expect(text()).toContain('Antiguo');
    expect(text()).toContain('Divertirme');
    expect(text()).toContain('ghost');
  });

  it('leaves out of the edit form the stored goal that is no longer active', async () => {
    catalogs.list.mockImplementation(async (id) =>
      id === 'sportLevels'
        ? [{ code: 'intermediate', label: 'Intermedio', order: 1, active: true }]
        : [{ code: 'pace', label: 'Mejorar mi ritmo', order: 1, active: true }],
    );
    await create(STORED);

    (fixture.nativeElement.querySelector('.actions ion-button') as HTMLElement).click();
    await settle();

    expect(page()['form'].getRawValue().goals).toEqual(['pace']);
    expect(page().hasUnsavedChanges()).toBe(false);
  });

  it('shows the catalog failure with a retry instead of a form that cannot be filled', async () => {
    catalogs.list.mockRejectedValueOnce(new ApiError(0, 'network', 'No hay conexión.'));
    await create(null);

    expect(text()).toContain('No hay conexión.');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();

    const retry = [...fixture.nativeElement.querySelectorAll('ion-button')].find(
      (el) => (el as HTMLElement).textContent?.trim() === 'Reintentar',
    ) as HTMLElement;
    retry.click();
    await settle();

    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });
});
