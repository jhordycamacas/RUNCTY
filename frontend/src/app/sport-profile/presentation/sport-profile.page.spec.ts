import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
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

  const text = () => fixture.nativeElement.textContent as string;
  const page = () => fixture.componentInstance;
  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
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
});
