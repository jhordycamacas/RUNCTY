import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { CityRepository } from '../../../cities/domain/city';
import { ApiError } from '../../../core/errors/api-error';
import {
  FakeSystemSettingsStore,
  fakeSystemSettingsStore,
  provideSystemSettings,
} from '../../../core/settings/testing/fake-system-settings.store';
import { route } from '../../../routes/domain/testing/fixtures';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminRoutesStore } from '../application/admin-routes.store';
import { RouteAdminRepository } from '../domain/managed-route';
import { RouteForm } from '../domain/route-form';
import {
  FakeRouteAdminRepository,
  fakeRouteAdminRepository,
  managedDetail,
  settle,
} from '../testing/fake-route-admin.repository';
import { RouteFormPage } from './route-form.page';

const VALID: Partial<RouteForm> = {
  name: 'Parque Jipiro',
  cityId: 'loja',
  startLabel: 'Entrada',
  startLat: '-3.97',
  startLng: '-79.2',
  endLabel: 'Puente',
  endLat: '-3.98',
  endLng: '-79.21',
  distanceKm: '3,2',
  elevationGainM: '15',
  surface: 'Asfalto',
  difficulty: 'Principiante',
};

const STORED = route('jipiro', {
  name: 'Parque Jipiro',
  cityId: 'loja',
  start: { label: 'Entrada', lat: -3.97, lng: -79.2 },
  end: { label: 'Puente', lat: -3.98, lng: -79.21 },
  distanceKm: 3.2,
  elevationGainM: 15,
  active: false,
});

describe('RouteFormPage', () => {
  let fixture: ComponentFixture<RouteFormPage>;
  let repository: FakeRouteAdminRepository;
  let settings: FakeSystemSettingsStore;
  let success: ReturnType<typeof vi.fn<ToastService['success']>>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let routeId: string | null;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const page = () => fixture.componentInstance;
  /** What each text input shows as its error (a property of `ion-input`, whatever its hydration). */
  const inputErrors = () =>
    [...root().querySelectorAll('ion-input')].map((el) => (el as unknown as { errorText: string }).errorText);
  const form = () => page()['form'];

  async function create(id: string | null): Promise<void> {
    routeId = id;
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(RouteFormPage);
    fixture.detectChanges();
    await settle(fixture);
  }
  async function submit(): Promise<void> {
    root().querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
  }

  beforeEach(() => {
    repository = fakeRouteAdminRepository();
    settings = fakeSystemSettingsStore();
    repository.get.mockResolvedValue(managedDetail(STORED));
    success = vi.fn<ToastService['success']>().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideSystemSettings(settings),
        AdminRoutesStore,
        { provide: RouteAdminRepository, useValue: repository },
        {
          provide: CityRepository,
          useValue: { list: async () => [{ id: 'loja', name: 'Loja' }] },
        },
        { provide: ToastService, useValue: { success } },
        {
          provide: ActivatedRoute,
          useFactory: () => ({
            snapshot: { paramMap: convertToParamMap(routeId ? { id: routeId } : {}) },
          }),
        },
      ],
    });
  });

  it('creates a route, confirms it and goes back to the list', async () => {
    await create(null);
    expect(text()).toContain('Nueva ruta');
    form().patchValue(VALID);

    await submit();

    expect(repository.createRoute).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Parque Jipiro', distanceKm: 3.2, active: true }),
    );
    expect(success).toHaveBeenCalledWith('Ruta creada.');
    expect(navigate).toHaveBeenCalledWith('/admin/rutas');
    expect(page().hasUnsavedChanges()).toBe(false);
  });

  it('shows the field messages in Spanish and sends nothing when the input is invalid', async () => {
    await create(null);

    await submit();

    expect(repository.createRoute).not.toHaveBeenCalled();
    expect(text()).toContain('Elige la ciudad o zona de la ruta.');
    expect(text()).toContain('Escribe la dificultad, por ejemplo Media.');
  });

  it('reads the system settings and validates the route with their limits', async () => {
    settings.use({ routeNameMaxLength: 12, routeMaxDistanceKm: 10 });
    await create(null);
    form().patchValue({ ...VALID, name: 'Nombre demasiado largo', distanceKm: '11' });

    await submit();

    expect(settings.load).toHaveBeenCalled();
    expect(repository.createRoute).not.toHaveBeenCalled();
    expect(inputErrors()).toContain('El nombre admite máximo 12 caracteres.');
    expect(inputErrors()).toContain('La distancia debe ser mayor que 0 y máximo 10 km.');
    expect(root().querySelector('input[maxlength="12"]')).not.toBeNull();
  });

  it('preselects the city chosen in the list for a new route', async () => {
    const store = TestBed.inject(AdminRoutesStore);
    store.cityId.set('loja');

    await create(null);

    expect(form().getRawValue().cityId).toBe('loja');
    expect(page().hasUnsavedChanges()).toBe(false);
  });

  it('preloads the current values to edit, and saves them', async () => {
    await create('jipiro');

    expect(text()).toContain('Editar ruta');
    expect(form().getRawValue()).toEqual(
      expect.objectContaining({ name: 'Parque Jipiro', distanceKm: '3.2', active: false }),
    );
    expect(page().hasUnsavedChanges()).toBe(false);

    form().patchValue({ name: 'Jipiro renovado' });
    expect(page().hasUnsavedChanges()).toBe(true);
    await submit();

    expect(repository.updateRoute).toHaveBeenCalledWith(
      'jipiro',
      expect.objectContaining({ name: 'Jipiro renovado', active: false }),
    );
    expect(success).toHaveBeenCalledWith('Ruta actualizada.');
  });

  it('moves the focus to the form once it is ready', async () => {
    await create('jipiro');

    expect(document.activeElement?.textContent?.trim()).toBe('Editar ruta');
  });

  it('offers a retry when the route cannot be loaded', async () => {
    repository.get.mockRejectedValueOnce(
      new ApiError(404, 'route-not-found', 'La ruta ya no existe.'),
    );
    await create('jipiro');

    expect(text()).toContain('La ruta ya no existe.');
    expect(root().querySelector('form')).toBeNull();

    root().querySelector('ion-button')?.dispatchEvent(new Event('click'));
    await settle(fixture);

    expect(root().querySelector('form')).not.toBeNull();
  });

  it('shows the API reason and keeps the draft when the save fails', async () => {
    repository.createRoute.mockRejectedValueOnce(
      new ApiError(404, 'city-not-found', 'La ciudad no existe.'),
    );
    await create(null);
    form().patchValue(VALID);

    await submit();

    expect(text()).toContain('La ciudad no existe.');
    expect(page().hasUnsavedChanges()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
