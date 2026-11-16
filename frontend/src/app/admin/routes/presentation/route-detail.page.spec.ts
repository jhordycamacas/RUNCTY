import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ApiError } from '../../../core/errors/api-error';
import { route, segment, slot } from '../../../routes/domain/testing/fixtures';
import { ConfirmActionOptions, ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../shared/ui/toast.service';
import { ManagedRouteDetail, RouteAdminRepository } from '../domain/managed-route';
import {
  FakeRouteAdminRepository,
  fakeRouteAdminRepository,
  managedDetail,
  settle,
} from '../testing/fake-route-admin.repository';
import { RouteDetailPage } from './route-detail.page';
import { SegmentsSection } from './segments-section';

const DETAIL: ManagedRouteDetail = managedDetail(
  route('jipiro', {
    name: 'Parque Jipiro',
    distanceKm: 3.2,
    active: false,
    safety: [slot('morning', '05:00', '07:00', 90), slot('night', '18:00', '20:00', 30)],
  }),
  {
    timeSlots: [
      {
        id: 'morning',
        label: 'Mañana',
        startTime: '05:00',
        endTime: '07:00',
        validFrom: null,
        validTo: null,
      },
      {
        id: 'night',
        label: null,
        startTime: '18:00',
        endTime: '20:00',
        validFrom: null,
        validTo: null,
      },
    ],
    segments: [
      {
        ...segment('s1', {
          name: 'Entrada',
          order: 0,
          coordinates: [
            { lat: -3.97, lng: -79.2 },
            { lat: -3.971, lng: -79.201 },
          ],
          safety: {
            morning: { level: 'high', score: 90, factors: [] },
            night: { level: 'low', score: 30, factors: [] },
          },
        }),
        riskFactors: [],
      },
      {
        ...segment('s2', { name: 'Orilla del río', order: 1, safety: {} }),
        riskFactors: [],
      },
    ],
  },
);

describe('RouteDetailPage', () => {
  let fixture: ComponentFixture<RouteDetailPage>;
  let repository: FakeRouteAdminRepository;
  let confirmAction: ReturnType<typeof vi.fn<ConfirmDialog['confirmAction']>>;
  let success: ReturnType<typeof vi.fn<ToastService['success']>>;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const section = () =>
    fixture.debugElement.query(By.directive(SegmentsSection)).componentInstance as SegmentsSection;
  const segmentForm = () => section()['form'];
  const segmentNames = () =>
    [...root().querySelectorAll('.segment-name')].map((el) => el.textContent?.trim());
  const button = (label: string, scope: Element = root()) =>
    [...scope.querySelectorAll('ion-button')].find((el) => el.textContent?.trim() === label);
  const segmentButton = (name: string, label: string) =>
    button(
      label,
      [...root().querySelectorAll('.segment')].find((row) =>
        row.querySelector('.segment-name')?.textContent?.includes(name),
      ) ?? root(),
    );
  const press = async (element: Element | undefined) => {
    expect(element).toBeDefined();
    element?.dispatchEvent(new Event('click'));
    await settle(fixture);
  };
  async function submitSegment(): Promise<void> {
    root().querySelector('app-segments-section form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
  }

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(RouteDetailPage);
    fixture.detectChanges();
    fixture.componentInstance.ionViewWillEnter();
    await settle(fixture);
  }

  beforeEach(() => {
    repository = fakeRouteAdminRepository();
    repository.get.mockResolvedValue(DETAIL);
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
        { provide: RouteAdminRepository, useValue: repository },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'jipiro' }) } },
        },
        { provide: ConfirmDialog, useValue: { confirmAction, confirm: async () => true } },
        { provide: ToastService, useValue: { success } },
      ],
    });
  });

  it('shows the route summary and its segments in order with the level per slot', async () => {
    await create();

    expect(repository.get).toHaveBeenCalledWith('jipiro');
    expect(text()).toContain('Parque Jipiro');
    expect(text()).toContain('Inactiva');
    expect(segmentNames()).toEqual(['1. Entrada', '2. Orilla del río']);
    expect(text()).toContain('Mañana (05:00 – 07:00)');
    expect(text()).toContain('Alto');
    expect(text()).toContain('Bajo');
    expect(text()).toContain('Sin evaluar');
    expect(text()).not.toMatch(/segura|insegura/i);
  });

  it('shows a loading state, then an error with a retry', async () => {
    repository.get.mockReturnValueOnce(new Promise<never>(() => undefined));
    await create();
    expect(text()).toContain('Cargando ruta…');

    repository.get.mockRejectedValueOnce(
      new ApiError(404, 'route-not-found', 'La ruta ya no existe.'),
    );
    await create();
    expect(text()).toContain('La ruta ya no existe.');

    await press(button('Reintentar'));
    expect(segmentNames()).toHaveLength(2);
  });

  it('says so when the route has no segments yet', async () => {
    repository.get.mockResolvedValue({ ...DETAIL, segments: [] });

    await create();

    expect(text()).toContain('Esta ruta aún no tiene tramos.');
  });

  it('adds a segment, moving the focus to the form and refreshing the detail', async () => {
    await create();

    await press(button('Agregar tramo'));

    expect(document.activeElement?.textContent?.trim()).toBe('Nuevo tramo');
    segmentForm().setValue({
      name: 'Puente',
      position: '',
      coordinates: '-3.9, -79.2\n-3.91, -79.21',
    });
    await submitSegment();

    expect(repository.createSegment).toHaveBeenCalledWith('jipiro', {
      name: 'Puente',
      coordinates: [
        { lat: -3.9, lng: -79.2 },
        { lat: -3.91, lng: -79.21 },
      ],
    });
    expect(repository.get).toHaveBeenCalledTimes(2);
    expect(success).toHaveBeenCalledWith('Tramo agregado.');
    expect(root().querySelector('app-segments-section form')).toBeNull();
  });

  it('shows the field messages in Spanish and sends nothing when the segment is invalid', async () => {
    await create();
    await press(button('Agregar tramo'));

    segmentForm().setValue({ name: 'Puente', position: '0', coordinates: '-3.9, -79.2' });
    await submitSegment();

    expect(repository.createSegment).not.toHaveBeenCalled();
    expect(text()).toContain('Ingresa al menos 2 puntos, uno por línea.');
  });

  it('edits a segment with its values preloaded', async () => {
    await create();

    await press(segmentButton('Entrada', 'Editar'));

    expect(document.activeElement?.textContent?.trim()).toBe('Editar tramo');
    expect(segmentForm().getRawValue()).toEqual({
      name: 'Entrada',
      position: '1',
      coordinates: '-3.97, -79.2\n-3.971, -79.201',
    });
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);

    segmentForm().patchValue({ name: 'Entrada norte', position: '2' });
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
    await submitSegment();

    expect(repository.updateSegment).toHaveBeenCalledWith(
      'jipiro',
      's1',
      expect.objectContaining({ name: 'Entrada norte', order: 1 }),
    );
    expect(success).toHaveBeenCalledWith('Tramo actualizado.');
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);
  });

  it('shows the API reason in Spanish and keeps the form when the save fails', async () => {
    repository.createSegment.mockRejectedValueOnce(
      new ApiError(409, 'too-many-segments', 'Una ruta admite máximo 50 tramos.'),
    );
    await create();
    await press(button('Agregar tramo'));
    segmentForm().setValue({ name: 'Puente', position: '', coordinates: '1, 2\n3, 4' });

    await submitSegment();

    expect(text()).toContain('Una ruta admite máximo 50 tramos.');
    expect(root().querySelector('app-segments-section form')).not.toBeNull();
    expect(success).not.toHaveBeenCalled();
  });

  it('asks before deleting a segment with a destructive button', async () => {
    await create();

    await press(segmentButton('Orilla del río', 'Eliminar'));

    expect(confirmAction).toHaveBeenCalledWith(
      expect.objectContaining({ confirmText: 'Eliminar', destructive: true }),
    );
    expect(repository.deleteSegment).toHaveBeenCalledWith('jipiro', 's2');
    expect(repository.get).toHaveBeenCalledTimes(2);
    expect(success).toHaveBeenCalledWith('Tramo eliminado.');
  });

  it('hands the API refusal of a deletion to the dialog, which shows it in Spanish', async () => {
    let refusal: unknown;
    confirmAction.mockImplementationOnce(async (options: ConfirmActionOptions) => {
      refusal = await options.run().catch((error: unknown) => error);
      return false;
    });
    repository.deleteSegment.mockRejectedValueOnce(
      new ApiError(404, 'segment-not-found', 'El tramo ya no existe.'),
    );
    await create();

    await press(segmentButton('Entrada', 'Eliminar'));

    expect((refusal as Error).message).toBe('El tramo ya no existe.');
    expect(success).not.toHaveBeenCalled();
  });
});
