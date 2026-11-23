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
import { IMAGE_CODEC } from '../../../shared/images/browser-image-codec';
import {
  FakeMapRenderer,
  provideFakeMapRenderer,
} from '../../../shared/map/testing/fake-map-renderer';
import { ImageCodec } from '../../../shared/images/image-codec';
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

const FULL = 'data:image/jpeg;base64,FULLFULL';
const THUMBNAIL = 'data:image/jpeg;base64,THUMB';
/** Decodes any file as a 3000x2000 picture; the full image and the thumbnail differ by width. */
const FAKE_CODEC: ImageCodec = {
  decode: async () => ({
    width: 3000,
    height: 2000,
    encode: () => {
      throw new Error('never cropped');
    },
    encodeFit: (width) => (width > 480 ? FULL : THUMBNAIL),
    close: () => undefined,
  }),
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
  let map: FakeMapRenderer;

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
  async function press(element: Element | undefined): Promise<void> {
    element?.dispatchEvent(new Event('click'));
    await settle(fixture);
  }
  async function submit(): Promise<void> {
    root().querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
  }

  beforeEach(() => {
    map = new FakeMapRenderer();
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
        { provide: IMAGE_CODEC, useValue: FAKE_CODEC },
        provideFakeMapRenderer(map),
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

  describe('map', () => {
    const click = async (lat: number, lng: number) => {
      map.click({ lat, lng });
      await settle(fixture);
    };
    const mode = (label: string) =>
      [...root().querySelectorAll<HTMLButtonElement>('.mode')].find(
        (el) => el.textContent?.trim() === label,
      ) as HTMLButtonElement;

    it('marks the start with the first click and moves on to the end', async () => {
      await create(null);
      expect(mode('Marcar inicio').getAttribute('aria-pressed')).toBe('true');
      expect(text()).toContain('Inicio: sin marcar');

      await click(-3.99313, -79.20422);

      expect(form().getRawValue()).toMatchObject({ startLat: '-3.99313', startLng: '-79.20422' });
      expect(text()).toContain('Inicio: -3.99313, -79.20422');
      expect(mode('Marcar fin').getAttribute('aria-pressed')).toBe('true');
      expect(map.scene?.markers).toEqual([{ kind: 'start', at: { lat: -3.99313, lng: -79.20422 } }]);
      expect(map.scene?.lines).toEqual([]);
    });

    it('marks the end with the second click and joins both points with a line', async () => {
      await create(null);

      await click(-3.97, -79.2);
      await click(-3.98123456789, -79.21);

      expect(form().getRawValue()).toMatchObject({ endLat: '-3.981235', endLng: '-79.21' });
      expect(map.scene?.markers.map((marker) => marker.kind)).toEqual(['start', 'end']);
      expect(map.scene?.lines).toHaveLength(1);
    });

    it('lets the admin choose which point the next click sets', async () => {
      await create(null);
      await click(-3.97, -79.2);

      await press(mode('Marcar inicio'));
      await click(-3.9, -79.1);

      expect(form().getRawValue()).toMatchObject({ startLat: '-3.9', startLng: '-79.1', endLat: '' });
    });

    it('clears both points and goes back to the start', async () => {
      await create('jipiro');
      expect(text()).toContain('Inicio: -3.97, -79.2');

      await press(mode('Limpiar puntos'));

      expect(form().getRawValue()).toMatchObject({ startLat: '', endLng: '' });
      expect(map.scene?.markers).toEqual([]);
      expect(mode('Marcar inicio').getAttribute('aria-pressed')).toBe('true');
      expect(page().hasUnsavedChanges()).toBe(true);
    });

    it('shows the points of the route being edited', async () => {
      await create('jipiro');

      expect(map.scene?.markers.map((marker) => marker.kind)).toEqual(['start', 'end']);
      expect(text()).toContain('Fin: -3.98, -79.21');
    });

    it('asks to mark the points on the map when they are missing', async () => {
      await create(null);
      form().patchValue({ ...VALID, startLat: '', startLng: '', endLat: '', endLng: '' });

      await submit();

      expect(repository.createRoute).not.toHaveBeenCalled();
      expect(text()).toContain('Marca el inicio en el mapa.');
      expect(text()).toContain('Marca el fin en el mapa.');
    });

    it('creates the route with the clicked coordinates', async () => {
      await create(null);
      form().patchValue({ ...VALID, startLat: '', startLng: '', endLat: '', endLng: '' });
      await click(-3.97, -79.2);
      await click(-3.98, -79.21);

      await submit();

      expect(repository.createRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          start: { label: 'Entrada', lat: -3.97, lng: -79.2 },
          end: { label: 'Puente', lat: -3.98, lng: -79.21 },
        }),
      );
    });
  });

  describe('image', () => {
    const image = () => root().querySelector('app-route-image-field img') as HTMLImageElement | null;
    const picture = { type: 'image/png', size: 1000 } as unknown as File;
    const pick = async (file: File = picture) => {
      await page()['pickImage'](file);
      fixture.detectChanges();
    };

    it('shows no image for a route without one', async () => {
      await create('jipiro');

      expect(image()).toBeNull();
      expect(text()).toContain('Elegir imagen');
    });

    it('uploads the picked image after creating the route', async () => {
      await create(null);
      form().patchValue(VALID);
      await pick();
      expect(image()?.getAttribute('src')).toBe(THUMBNAIL);
      expect(page().hasUnsavedChanges()).toBe(true);

      await submit();

      expect(repository.createRoute).toHaveBeenCalled();
      expect(repository.setImage).toHaveBeenCalledWith('new-id', { image: FULL, thumbnail: THUMBNAIL });
      expect(navigate).toHaveBeenCalledWith('/admin/rutas');
    });

    it('saves the route without touching the image when none was picked', async () => {
      await create(null);
      form().patchValue(VALID);

      await submit();

      expect(repository.setImage).not.toHaveBeenCalled();
      expect(repository.removeImage).not.toHaveBeenCalled();
    });

    it('shows the stored thumbnail and removes the image on save', async () => {
      repository.get.mockResolvedValue(managedDetail({ ...STORED, imageThumb: THUMBNAIL }));
      await create('jipiro');
      expect(image()?.getAttribute('src')).toBe(THUMBNAIL);
      expect(page().hasUnsavedChanges()).toBe(false);

      page()['removeImage']();
      fixture.detectChanges();
      expect(image()).toBeNull();
      expect(page().hasUnsavedChanges()).toBe(true);
      await submit();

      expect(repository.updateRoute).toHaveBeenCalled();
      expect(repository.removeImage).toHaveBeenCalledWith('jipiro');
    });

    it('dropping a picked image on a route without one sends nothing', async () => {
      await create('jipiro');
      await pick();

      page()['removeImage']();
      fixture.detectChanges();
      expect(image()).toBeNull();
      expect(page().hasUnsavedChanges()).toBe(false);
      await submit();

      expect(repository.setImage).not.toHaveBeenCalled();
      expect(repository.removeImage).not.toHaveBeenCalled();
    });

    it('explains a file that is not an image and keeps the form', async () => {
      await create('jipiro');

      await pick({ type: 'application/pdf', size: 10 } as unknown as File);

      expect(text()).toContain('El archivo no es una imagen.');
      expect(image()).toBeNull();
      expect(page().hasUnsavedChanges()).toBe(false);
    });

    it('keeps the saved route when the image fails and only retries the image', async () => {
      repository.setImage.mockRejectedValueOnce(
        new ApiError(400, 'invalid-argument', 'Datos inválidos.', { image: 'too-large' }),
      );
      await create(null);
      form().patchValue(VALID);
      await pick();

      await submit();

      expect(text()).toContain(
        'La ruta se guardó, pero la imagen no. La imagen pesa más de lo permitido.',
      );
      expect(navigate).not.toHaveBeenCalled();
      expect(page().hasUnsavedChanges()).toBe(true);

      await submit();

      expect(repository.createRoute).toHaveBeenCalledOnce();
      expect(repository.updateRoute).toHaveBeenCalledWith('new-id', expect.anything());
      expect(repository.setImage).toHaveBeenCalledTimes(2);
      expect(navigate).toHaveBeenCalledWith('/admin/rutas');
    });
  });
});
