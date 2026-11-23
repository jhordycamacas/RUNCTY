import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { ApiError } from '../../../core/errors/api-error';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminCitiesStore } from '../application/admin-cities.store';
import { CityForm } from '../domain/city-form';
import { CityAdminRepository } from '../domain/managed-city';
import {
  FakeCityAdminRepository,
  city,
  fakeCityAdminRepository,
  settle,
  zone,
} from '../testing/fake-city-admin.repository';
import { CityFormPage } from './city-form.page';

const VALID: Partial<CityForm> = {
  type: 'city',
  id: 'cuenca',
  name: 'Cuenca',
  province: 'Azuay',
  lat: '-2.9',
  lng: '-79',
  coverage: 'planned',
};

describe('CityFormPage', () => {
  let fixture: ComponentFixture<CityFormPage>;
  let repository: FakeCityAdminRepository;
  let success: ReturnType<typeof vi.fn<ToastService['success']>>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let cityId: string | null;
  let query: Record<string, string>;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const page = () => fixture.componentInstance;
  const form = () => page()['form'];

  async function create(id: string | null, params: Record<string, string> = {}): Promise<void> {
    cityId = id;
    query = params;
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(CityFormPage);
    fixture.detectChanges();
    await settle(fixture);
  }
  async function submit(): Promise<void> {
    root().querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
  }

  beforeEach(() => {
    repository = fakeCityAdminRepository();
    repository.list.mockResolvedValue([
      city('loja', { name: 'Loja' }),
      zone('loja-centro', 'loja', { name: 'Centro', coverage: 'suspended' }),
    ]);
    success = vi.fn<ToastService['success']>().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        AdminCitiesStore,
        { provide: CityAdminRepository, useValue: repository },
        { provide: ToastService, useValue: { success } },
        {
          provide: ActivatedRoute,
          useFactory: () => ({
            snapshot: {
              paramMap: convertToParamMap(cityId ? { id: cityId } : {}),
              queryParamMap: convertToParamMap(query),
            },
          }),
        },
      ],
    });
  });

  it('creates a city, confirms it and goes back to the list', async () => {
    await create(null);
    expect(text()).toContain('Nueva ciudad o zona');
    form().patchValue(VALID);

    await submit();

    expect(repository.create).toHaveBeenCalledWith({
      id: 'cuenca',
      type: 'city',
      name: 'Cuenca',
      province: 'Azuay',
      location: { lat: -2.9, lng: -79 },
      coverage: 'planned',
      parentCityId: null,
    });
    expect(success).toHaveBeenCalledWith('Ciudad creada.');
    expect(navigate).toHaveBeenCalledWith('/admin/ciudades');
    expect(page().hasUnsavedChanges()).toBe(false);
  });

  it('creates a zone when the admin picks a parent city, whatever the type text', async () => {
    await create(null);
    form().patchValue({ ...VALID, type: 'Barrio', id: 'cuenca-centro', parentCityId: 'loja' });
    await settle(fixture);

    await submit();

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Barrio', parentCityId: 'loja' }),
    );
    expect(success).toHaveBeenCalledWith('Zona creada.');
  });

  it('types the type and coverage as free text and offers an optional parent city', async () => {
    await create(null);

    expect(root().querySelectorAll('app-select-field')).toHaveLength(1);
    expect(root().querySelectorAll('app-text-field')).toHaveLength(7);
    expect(text()).toContain('Ciudad a la que pertenece (opcional)');
  });

  it('starts a zone of the city chosen in the list', async () => {
    await create(null, { ciudad: 'loja' });

    expect(form().getRawValue()).toEqual(
      expect.objectContaining({ parentCityId: 'loja' }),
    );
    expect(page().hasUnsavedChanges()).toBe(false);
  });

  it('shows the field messages in Spanish and sends nothing when the input is invalid', async () => {
    await create(null);

    await submit();

    expect(repository.create).not.toHaveBeenCalled();
    expect(text()).toContain('El tipo es obligatorio.');
    expect(text()).toContain('La cobertura es obligatoria.');
  });

  it('shows the API rejection in the form and keeps what was typed', async () => {
    repository.create.mockRejectedValueOnce(
      new ApiError(409, 'city-exists', 'Ya existe una ciudad con ese identificador.'),
    );
    await create(null);
    form().patchValue(VALID);

    await submit();

    expect(text()).toContain('Ya existe una ciudad con ese identificador.');
    expect(form().getRawValue().name).toBe('Cuenca');
    expect(success).not.toHaveBeenCalled();
  });

  it('preloads the zone to edit, keeps the id fixed and saves the changes', async () => {
    await create('loja-centro');

    expect(text()).toContain('Editar zona');
    expect(form().getRawValue()).toEqual(
      expect.objectContaining({
        type: 'Zona',
        id: 'loja-centro',
        parentCityId: 'loja',
        coverage: 'suspended',
      }),
    );
    expect(form().controls.id.disabled).toBe(true);
    expect(form().controls.type.disabled).toBe(false);
    expect(page().hasUnsavedChanges()).toBe(false);

    form().patchValue({ coverage: 'Activa', type: 'Barrio' });
    expect(page().hasUnsavedChanges()).toBe(true);
    await submit();

    expect(repository.update).toHaveBeenCalledWith(
      'loja-centro',
      expect.objectContaining({ coverage: 'Activa', type: 'Barrio', parentCityId: 'loja' }),
    );
    expect(success).toHaveBeenCalledWith('Zona actualizada.');
    expect(navigate).toHaveBeenCalledWith('/admin/ciudades');
  });

  it('moves the focus to the form heading once it is ready', async () => {
    await create('loja');

    expect(document.activeElement?.textContent?.trim()).toBe('Editar ciudad');
  });

  it('says so when the place no longer exists', async () => {
    await create('ghost');

    expect(text()).toContain('La ciudad o zona ya no existe.');
    expect(root().querySelector('form')).toBeNull();
  });

  it('shows the loading failure with a retry', async () => {
    repository.list.mockRejectedValueOnce(new ApiError(0, 'network', 'Sin conexión.'));
    await create('loja');
    expect(text()).toContain('Sin conexión.');

    const retry = [...root().querySelectorAll('ion-button')].find(
      (el) => el.textContent?.trim() === 'Reintentar',
    );
    retry?.dispatchEvent(new Event('click'));
    await settle(fixture);

    expect(text()).toContain('Editar ciudad');
  });
});
