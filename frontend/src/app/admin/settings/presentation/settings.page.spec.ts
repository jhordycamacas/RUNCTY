import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiError } from '../../../core/errors/api-error';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../shared/ui/toast.service';
import { SettingsStore } from '../application/settings.store';
import { SETTING_GROUPS } from '../domain/settings-fields';
import { DEFAULT_SETTINGS } from '../../../core/settings/system-settings';
import { SettingsRepository } from '../domain/system-settings';
import {
  FakeSettingsRepository,
  fakeSettingsRepository,
  settle,
} from '../testing/fake-settings.repository';
import { SettingsPage } from './settings.page';

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;
  let repository: FakeSettingsRepository;
  let success: ReturnType<typeof vi.fn<ToastService['success']>>;
  let confirm: ReturnType<typeof vi.fn<ConfirmDialog['confirm']>>;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const page = () => fixture.componentInstance;
  const form = () => page()['form'];
  const button = (label: string) =>
    [...root().querySelectorAll('ion-button')].find((el) => el.textContent?.trim() === label) as
      | (HTMLElement & { disabled: boolean })
      | undefined;
  const press = async (label: string) => {
    expect(button(label)).toBeDefined();
    button(label)?.dispatchEvent(new Event('click'));
    await settle(fixture);
  };
  async function submit(): Promise<void> {
    root().querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
  }
  async function edit(values: Record<string, string>): Promise<void> {
    form().patchValue(values);
    await settle(fixture);
  }

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    await settle(fixture);
  }

  beforeEach(() => {
    repository = fakeSettingsRepository();
    success = vi.fn<ToastService['success']>().mockResolvedValue(undefined);
    confirm = vi.fn<ConfirmDialog['confirm']>().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        SettingsStore,
        { provide: SettingsRepository, useValue: repository },
        { provide: ToastService, useValue: { success } },
        { provide: ConfirmDialog, useValue: { confirm } },
      ],
    });
  });

  it('shows every group with its explanation and one field per parameter', async () => {
    await create();

    for (const group of SETTING_GROUPS) {
      expect(text()).toContain(group.title);
      expect(text()).toContain(group.description);
    }
    expect(root().querySelectorAll('section.panel')).toHaveLength(8);
    expect(root().querySelectorAll('app-text-field')).toHaveLength(28);
    expect(text()).toContain('Ejemplo: America/Guayaquil');
    expect(form().getRawValue().safeRouteDistanceTolerance).toBe('20');
  });

  it('offers the two screens of Configuración', async () => {
    await create();

    const links = [...root().querySelectorAll('nav a')].map((a) => a.textContent?.trim());
    expect(links).toEqual(['Parámetros', 'Opciones del perfil deportivo']);
  });

  it('reads out the levels and follows the thresholds while they are typed', async () => {
    await create();
    expect(text()).toContain('Alto desde 70, Medio desde 40, Bajo por debajo');

    await edit({ thresholdHigh: '80', thresholdMedium: '55' });
    expect(text()).toContain('Alto desde 80, Medio desde 55');

    await edit({ thresholdMedium: '' });
    expect(text()).toContain('Completa los umbrales para ver los niveles.');
  });

  it('keeps Guardar cambios disabled until something changes', async () => {
    await create();
    expect(button('Guardar cambios')?.disabled).toBe(true);
    expect(page().hasUnsavedChanges()).toBe(false);

    await edit({ penaltyHigh: '40' });
    expect(button('Guardar cambios')?.disabled).toBe(false);
    expect(page().hasUnsavedChanges()).toBe(true);

    await edit({ penaltyHigh: '35' });
    expect(button('Guardar cambios')?.disabled).toBe(true);
  });

  it('shows the field messages in Spanish and sends nothing when the input is invalid', async () => {
    await create();
    await edit({ penaltyHigh: '500', incidentWindowDays: '', thresholdMedium: '90' });

    await submit();

    expect(repository.save).not.toHaveBeenCalled();
    expect(text()).toContain('Debe estar entre 0 y 100.');
    expect(text()).toContain('Ingresa un valor.');
    expect(text()).toContain('Debe ser menor que el umbral del nivel Alto.');
  });

  it('saves only what changed, confirms it and takes the form as the new baseline', async () => {
    await create();
    await edit({ penaltyHigh: '50', safeRouteDistanceTolerance: '25' });

    await submit();

    expect(repository.save).toHaveBeenCalledWith({ penaltyHigh: 50, safeRouteDistanceTolerance: 0.25 });
    expect(success).toHaveBeenCalledWith('Configuración guardada.');
    expect(page().hasUnsavedChanges()).toBe(false);
    expect(button('Guardar cambios')?.disabled).toBe(true);
  });

  it('tells how many routes were recalculated when the save did that', async () => {
    repository.save.mockResolvedValue({ settings: { ...DEFAULT_SETTINGS, penaltyHigh: 50 }, recalculated: 12 });
    await create();
    await edit({ penaltyHigh: '50' });

    await submit();

    expect(success).toHaveBeenCalledWith('Configuración guardada. Se recalculó el índice de 12 rutas.');
  });

  it('shows the API rejection on its fields and keeps what was typed', async () => {
    repository.save.mockRejectedValueOnce(
      new ApiError(400, 'invalid-argument', 'Revisa los campos marcados.', {
        timeZone: 'invalid-time-zone',
        countryCode: 'invalid-country-code',
      }),
    );
    await create();
    await edit({ timeZone: 'Mars/Base' });

    await submit();

    expect(text()).toContain('Revisa los campos marcados.');
    expect(text()).toContain('No es una zona horaria válida. Ejemplo: America/Guayaquil.');
    expect(form().getRawValue().timeZone).toBe('Mars/Base');
    expect(success).not.toHaveBeenCalled();
    expect(page().hasUnsavedChanges()).toBe(true);

    await edit({ timeZone: 'America/Lima' });
    expect(text()).not.toContain('No es una zona horaria válida.');
  });

  it('fills the form with the defaults after confirming, and still needs saving', async () => {
    repository.load.mockResolvedValue({ ...DEFAULT_SETTINGS, penaltyHigh: 60, timeZone: 'America/Lima' });
    await create();
    expect(form().getRawValue().penaltyHigh).toBe('60');

    await press('Restablecer valores por defecto');

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ header: 'Restablecer valores por defecto' }),
    );
    expect(form().getRawValue().penaltyHigh).toBe('35');
    expect(form().getRawValue().timeZone).toBe('America/Guayaquil');
    expect(repository.save).not.toHaveBeenCalled();
    expect(button('Guardar cambios')?.disabled).toBe(false);
  });

  it('leaves the form alone when the reset is declined', async () => {
    repository.load.mockResolvedValue({ ...DEFAULT_SETTINGS, penaltyHigh: 60 });
    confirm.mockResolvedValue(false);
    await create();

    await press('Restablecer valores por defecto');

    expect(form().getRawValue().penaltyHigh).toBe('60');
  });

  it('recalculates the routes on demand and tells how many', async () => {
    repository.recalculateRoutes.mockResolvedValue(5);
    await create();

    await press('Recalcular rutas');

    expect(repository.recalculateRoutes).toHaveBeenCalledOnce();
    expect(success).toHaveBeenCalledWith('Se recalculó el índice de 5 rutas.');
  });

  it('shows the failure of the recalculation', async () => {
    repository.recalculateRoutes.mockRejectedValueOnce(new ApiError(500, 'internal', 'Algo salió mal.'));
    await create();

    await press('Recalcular rutas');

    expect(text()).toContain('Algo salió mal.');
    expect(success).not.toHaveBeenCalled();
  });

  it('shows the loading failure with a retry', async () => {
    repository.load.mockRejectedValueOnce(new ApiError(0, 'network', 'Sin conexión.'));
    await create();
    expect(text()).toContain('Sin conexión.');
    expect(root().querySelector('form')).toBeNull();

    await press('Reintentar');

    expect(root().querySelector('form')).not.toBeNull();
  });
});
