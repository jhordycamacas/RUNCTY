import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiError } from '../../../core/errors/api-error';
import { ConfirmActionOptions, ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminCitiesStore } from '../application/admin-cities.store';
import { CityAdminRepository } from '../domain/managed-city';
import {
  FakeCityAdminRepository,
  city,
  fakeCityAdminRepository,
  settle,
  zone,
} from '../testing/fake-city-admin.repository';
import { CitiesAdminPage } from './cities-admin.page';

const CITIES = [
  city('loja', { name: 'Loja', province: 'Loja', coverage: 'Activa' }),
  zone('loja-centro', 'loja', { name: 'Centro', coverage: 'Planificada' }),
  zone('loja-norte', 'loja', { name: 'Norte', coverage: 'Suspendida' }),
  city('quito', { name: 'Quito', province: 'Pichincha', coverage: 'Planificada' }),
  zone('huerfana', 'gone', { name: 'Zona huérfana' }),
];

describe('CitiesAdminPage', () => {
  let fixture: ComponentFixture<CitiesAdminPage>;
  let repository: FakeCityAdminRepository;
  let confirmAction: ReturnType<typeof vi.fn<ConfirmDialog['confirmAction']>>;
  let success: ReturnType<typeof vi.fn<ToastService['success']>>;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const names = () => [...root().querySelectorAll('.place-name')].map((el) => el.textContent?.trim());
  const row = (name: string) =>
    [...root().querySelectorAll('.place')].find(
      (el) => el.querySelector('.place-name')?.textContent?.trim() === name,
    ) ?? root();
  const button = (label: string, scope: Element = root()) =>
    [...scope.querySelectorAll('ion-button')].find((el) => el.textContent?.trim() === label);
  const press = async (element: Element | undefined) => {
    expect(element).toBeDefined();
    element?.dispatchEvent(new Event('click'));
    await settle(fixture);
  };

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(CitiesAdminPage);
    fixture.detectChanges();
    fixture.componentInstance.ionViewWillEnter();
    await settle(fixture);
  }

  beforeEach(() => {
    repository = fakeCityAdminRepository();
    repository.list.mockResolvedValue(CITIES);
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
        AdminCitiesStore,
        { provide: CityAdminRepository, useValue: repository },
        { provide: ConfirmDialog, useValue: { confirmAction } },
        { provide: ToastService, useValue: { success } },
      ],
    });
  });

  it('lists each city with its province and coverage, and its zones under it', async () => {
    await create();

    expect(names()).toEqual(['Loja', 'Centro', 'Norte', 'Quito', 'Zona huérfana']);
    expect(row('Loja').textContent).toContain('Activa');
    expect(row('Quito').textContent).toContain('Pichincha');
    expect(row('Quito').textContent).toContain('Planificada');
    expect(row('Norte').textContent).toContain('Suspendida');
    expect(row('Centro').textContent).toContain('Zona');
    expect(row('Loja').textContent).toContain('city');
    expect(root().querySelectorAll('li.group')).toHaveLength(3);
    expect(root().querySelector('li.group ul .place-name')?.textContent?.trim()).toBe('Centro');
  });

  it('shows the type the admin typed, as typed', async () => {
    repository.list.mockResolvedValue([city('x', { name: 'Equis', type: 'Región amazónica' })]);

    await create();

    expect(row('Equis').textContent).toContain('Región amazónica');
  });

  it('shows a loading state while the catalogue arrives', async () => {
    repository.list.mockReturnValue(new Promise<never>(() => undefined));

    await create();

    expect(text()).toContain('Cargando ciudades…');
  });

  it('shows the error with a retry', async () => {
    repository.list.mockRejectedValueOnce(
      new ApiError(0, 'network', 'No hay conexión con el servidor.'),
    );
    await create();

    expect(text()).toContain('No hay conexión con el servidor.');
    expect(names()).toEqual([]);

    await press(button('Reintentar'));

    expect(names()).toHaveLength(5);
  });

  it('says so when there are no cities yet', async () => {
    repository.list.mockResolvedValue([]);

    await create();

    expect(text()).toContain('Aún no hay ciudades ni zonas.');
  });

  it('asks before deleting with a destructive button and drops the zone', async () => {
    await create();

    await press(button('Eliminar', row('Centro')));

    expect(confirmAction).toHaveBeenCalledWith(
      expect.objectContaining({ confirmText: 'Eliminar', destructive: true }),
    );
    expect(repository.delete).toHaveBeenCalledWith('loja-centro');
    expect(names()).not.toContain('Centro');
    expect(success).toHaveBeenCalledWith('Zona eliminada.');
  });

  it('says "Ciudad eliminada." for a city', async () => {
    await create();

    await press(button('Eliminar', row('Quito')));

    expect(success).toHaveBeenCalledWith('Ciudad eliminada.');
  });

  it('keeps the city when the deletion is cancelled', async () => {
    confirmAction.mockResolvedValueOnce(false);
    await create();

    await press(button('Eliminar', row('Quito')));

    expect(repository.delete).not.toHaveBeenCalled();
    expect(names()).toHaveLength(5);
    expect(success).not.toHaveBeenCalled();
  });

  it('offers to edit every place and to add a zone only to a city', async () => {
    await create();

    expect(button('Nueva ciudad o zona')).toBeDefined();
    expect(button('Editar', row('Loja'))).toBeDefined();
    expect(button('Editar', row('Centro'))).toBeDefined();
    expect(button('Agregar zona', row('Loja'))).toBeDefined();
    expect(button('Agregar zona', row('Centro'))).toBeUndefined();
  });
});
