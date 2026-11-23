import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterLink, provideRouter } from '@angular/router';
import { CityRepository } from '../../../cities/domain/city';
import { ApiError } from '../../../core/errors/api-error';
import { route, slot } from '../../../routes/domain/testing/fixtures';
import { ConfirmActionOptions, ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminRoutesStore } from '../application/admin-routes.store';
import { RouteAdminRepository } from '../domain/managed-route';
import {
  FakeRouteAdminRepository,
  fakeRouteAdminRepository,
  settle,
} from '../testing/fake-route-admin.repository';
import { RoutesAdminPage } from './routes-admin.page';

const ROUTES = [
  route('jipiro', {
    name: 'Parque Jipiro',
    distanceKm: 3.2,
    difficulty: 'Principiante',
    safety: [slot('morning', '05:00', '07:00', 90), slot('night', '18:00', '20:00', 30)],
  }),
  route('tebaida', {
    name: 'La Tebaida',
    distanceKm: 7.5,
    difficulty: 'Avanzado',
    active: false,
    safety: [slot('morning', '05:00', '07:00', 55)],
  }),
];

describe('RoutesAdminPage', () => {
  let fixture: ComponentFixture<RoutesAdminPage>;
  let repository: FakeRouteAdminRepository;
  let confirmAction: ReturnType<typeof vi.fn<ConfirmDialog['confirmAction']>>;
  let success: ReturnType<typeof vi.fn<ToastService['success']>>;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const names = () =>
    [...root().querySelectorAll('.route-name')].map((el) => el.textContent?.trim());
  const button = (label: string, scope: Element = root()) =>
    [...scope.querySelectorAll('ion-button')].find((el) => el.textContent?.trim() === label);
  /** Ionic moves `aria-label` into the shadow button, so the action is found inside its row. */
  const routeButton = (routeName: string, label: string) =>
    button(
      label,
      [...root().querySelectorAll('.route')].find(
        (row) => row.querySelector('.route-name')?.textContent?.trim() === routeName,
      ) ?? root(),
    );
  const press = async (element: Element | undefined) => {
    expect(element).toBeDefined();
    element?.dispatchEvent(new Event('click'));
    await settle(fixture);
  };

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(RoutesAdminPage);
    fixture.detectChanges();
    fixture.componentInstance.ionViewWillEnter();
    await settle(fixture);
  }

  beforeEach(() => {
    repository = fakeRouteAdminRepository();
    repository.list.mockResolvedValue(ROUTES);
    confirmAction = vi
      .fn<ConfirmDialog['confirmAction']>()
      .mockImplementation(async (options: ConfirmActionOptions) => {
        await options.run();
        return true;
      });
    success = vi.fn<ToastService['success']>().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        AdminRoutesStore,
        { provide: RouteAdminRepository, useValue: repository },
        {
          provide: CityRepository,
          useValue: { list: async () => [{ id: 'loja', name: 'Loja' }] },
        },
        { provide: ConfirmDialog, useValue: { confirmAction } },
        { provide: ToastService, useValue: { success } },
      ],
    });
  });

  it('lists every route with distance, difficulty, status and the level per slot', async () => {
    await create();

    expect(names()).toEqual(['Parque Jipiro', 'La Tebaida']);
    expect(text()).toContain('3,2 km');
    expect(text()).toContain('Principiante');
    expect(text()).toContain('Activa');
    expect(text()).toContain('Inactiva');
    expect(text()).toContain('05:00 – 07:00');
    expect(text()).toContain('Alto');
    expect(text()).toContain('Bajo');
    expect(text()).not.toMatch(/segura|insegura/i);
  });

  it('shows the segment count and opens the detail on its segments tab', async () => {
    await create();

    expect(text()).toContain('1 tramo');
    const action = routeButton('Parque Jipiro', 'Tramos');
    const link = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .find((element) => element.nativeElement === action)
      ?.injector.get(RouterLink);
    expect(link?.urlTree?.toString()).toBe('/admin/rutas/jipiro?seccion=tramos');
  });

  it('lists the routes of the city chosen in the picker', async () => {
    await create();
    const select = root().querySelector('select') as HTMLSelectElement;
    expect([...select.options].map((option) => option.text.trim())).toEqual([
      'Todas las ciudades',
      'Loja',
    ]);

    repository.list.mockResolvedValueOnce([ROUTES[0]]);
    select.value = 'loja';
    select.dispatchEvent(new Event('change'));
    await settle(fixture);

    expect(repository.list).toHaveBeenLastCalledWith('loja');
    expect(names()).toEqual(['Parque Jipiro']);
  });

  it('shows a loading state while the routes arrive', async () => {
    repository.list.mockReturnValue(new Promise<never>(() => undefined));

    await create();

    expect(text()).toContain('Cargando rutas…');
  });

  it('shows the error with a retry', async () => {
    repository.list.mockRejectedValueOnce(
      new ApiError(0, 'network', 'No hay conexión con el servidor.'),
    );
    await create();

    expect(text()).toContain('No hay conexión con el servidor.');
    expect(names()).toEqual([]);

    await press(button('Reintentar'));

    expect(names()).toHaveLength(2);
  });

  it('says so when there are no routes yet', async () => {
    repository.list.mockResolvedValue([]);

    await create();

    expect(text()).toContain('Aún no hay rutas');
  });

  it('filters by text and says when nothing matches', async () => {
    await create();
    const store = TestBed.inject(AdminRoutesStore);

    store.query.set('tebaida');
    await settle(fixture);
    expect(names()).toEqual(['La Tebaida']);

    store.query.set('zzz');
    await settle(fixture);
    expect(names()).toEqual([]);
    expect(text()).toContain('Ninguna ruta coincide con la búsqueda.');
  });

  it('asks before deleting with a destructive button and drops the route', async () => {
    await create();

    await press(routeButton('Parque Jipiro', 'Eliminar'));

    expect(confirmAction).toHaveBeenCalledWith(
      expect.objectContaining({ confirmText: 'Eliminar', destructive: true }),
    );
    expect(repository.deleteRoute).toHaveBeenCalledWith('jipiro');
    expect(names()).toEqual(['La Tebaida']);
    expect(success).toHaveBeenCalledWith('Ruta eliminada.');
  });

  it('keeps the route when the deletion is cancelled', async () => {
    confirmAction.mockResolvedValueOnce(false);
    await create();

    await press(routeButton('Parque Jipiro', 'Eliminar'));

    expect(repository.deleteRoute).not.toHaveBeenCalled();
    expect(names()).toHaveLength(2);
    expect(success).not.toHaveBeenCalled();
  });

  it('labels every control', async () => {
    await create();

    expect(root().querySelector('app-select-field label')?.textContent).toContain('Ciudad o zona');
    expect(root().querySelector('ion-input')?.getAttribute('label')).toBe('Buscar ruta');
    expect(routeButton('Parque Jipiro', 'Editar')).toBeDefined();
    expect(button('Nueva ruta')).toBeDefined();
  });
});
