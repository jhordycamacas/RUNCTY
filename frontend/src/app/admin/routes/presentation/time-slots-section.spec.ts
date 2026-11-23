import { Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { ApiError } from '../../../core/errors/api-error';
import {
  FakeSystemSettingsStore,
  fakeSystemSettingsStore,
  provideSystemSettings,
} from '../../../core/settings/testing/fake-system-settings.store';
import { route } from '../../../routes/domain/testing/fixtures';
import { ConfirmActionOptions, ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../shared/ui/toast.service';
import { RouteDetailStore } from '../application/route-detail.store';
import { ManagedRouteDetail, RouteAdminRepository, TimeSlot } from '../domain/managed-route';
import {
  FakeRouteAdminRepository,
  fakeRouteAdminRepository,
  managedDetail,
  settle,
} from '../testing/fake-route-admin.repository';
import { TimeSlotsSection } from './time-slots-section';

const timeSlot = (id: string, overrides: Partial<TimeSlot> = {}): TimeSlot => ({
  id,
  label: null,
  startTime: '00:00',
  endTime: '01:00',
  validFrom: null,
  validTo: null,
  ...overrides,
});

/** The API answers by start time; the section must not depend on it. */
const DETAIL: ManagedRouteDetail = managedDetail(route('jipiro'), {
  timeSlots: [
    timeSlot('night', { startTime: '18:00', endTime: '24:00', validFrom: '2026-01-01' }),
    timeSlot('morning', { label: 'Mañana', startTime: '05:00', endTime: '07:00' }),
  ],
});

@Component({
  imports: [TimeSlotsSection],
  providers: [RouteDetailStore],
  template: `<app-time-slots-section />`,
})
class Host {
  readonly store = inject(RouteDetailStore);
}

describe('TimeSlotsSection', () => {
  let fixture: ComponentFixture<Host>;
  let repository: FakeRouteAdminRepository;
  let settings: FakeSystemSettingsStore;
  let confirmAction: ReturnType<typeof vi.fn<ConfirmDialog['confirmAction']>>;
  let success: ReturnType<typeof vi.fn<ToastService['success']>>;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const section = () =>
    fixture.debugElement.query(By.directive(TimeSlotsSection))
      .componentInstance as TimeSlotsSection;
  const slotForm = () => section()['form'];
  const slotNames = () =>
    [...root().querySelectorAll('.slot-name')].map((el) => el.textContent?.trim());
  const button = (label: string, scope: Element = root()) =>
    [...scope.querySelectorAll('ion-button')].find((el) => el.textContent?.trim() === label);
  const slotButton = (name: string, label: string) =>
    button(
      label,
      [...root().querySelectorAll('.slot')].find((row) =>
        row.querySelector('.slot-name')?.textContent?.includes(name),
      ) ?? root(),
    );
  const press = async (element: Element | undefined) => {
    expect(element).toBeDefined();
    element?.dispatchEvent(new Event('click'));
    await settle(fixture);
  };
  async function submit(): Promise<void> {
    root().querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
  }

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.componentInstance.store.load('jipiro');
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
    settings = fakeSystemSettingsStore();
    TestBed.configureTestingModule({
      providers: [
        provideSystemSettings(settings),
        { provide: RouteAdminRepository, useValue: repository },
        { provide: ConfirmDialog, useValue: { confirmAction, confirm: async () => true } },
        { provide: ToastService, useValue: { success } },
      ],
    });
  });

  it('lists the slots by start time with their label and validity', async () => {
    await create();

    expect(slotNames()).toEqual(['05:00 – 07:00 (Mañana)', '18:00 – 24:00']);
    expect(text()).toContain('Vigente desde el 01/01/2026');
    expect(text()).toContain('Todos los días');
  });

  it('stops offering to add slots once the route holds the configured maximum', async () => {
    settings.use({ maxTimeSlotsPerRoute: 2 });
    await create();

    const add = button('Agregar franja');
    expect(add?.hasAttribute('disabled') || add?.getAttribute('aria-disabled') === 'true').toBe(
      true,
    );
    expect(text()).toContain('Máximo de 2 franjas por ruta alcanzado.');
  });

  it('says so when the route has no slots yet', async () => {
    repository.get.mockResolvedValue({ ...DETAIL, timeSlots: [] });

    await create();

    expect(text()).toContain('Esta ruta aún no tiene franjas horarias.');
  });

  it('adds a slot with time and date inputs, sending only the filled fields', async () => {
    await create();

    await press(button('Agregar franja'));

    expect(document.activeElement?.textContent?.trim()).toBe('Nueva franja');
    expect(root().querySelectorAll('input[type="time"]')).toHaveLength(2);
    expect(root().querySelectorAll('input[type="date"]')).toHaveLength(2);
    slotForm().setValue({
      label: ' Tarde ',
      startTime: '12:00',
      endTime: '14:00',
      validFrom: '',
      validTo: '2026-12-31',
    });
    await submit();

    expect(repository.createTimeSlot).toHaveBeenCalledWith('jipiro', {
      label: 'Tarde',
      startTime: '12:00',
      endTime: '14:00',
      validTo: '2026-12-31',
    });
    expect(repository.get).toHaveBeenCalledTimes(2);
    expect(success).toHaveBeenCalledWith('Franja agregada.');
    expect(root().querySelector('form')).toBeNull();
  });

  it('rejects an overlapping slot in Spanish and sends nothing', async () => {
    await create();
    await press(button('Agregar franja'));

    slotForm().setValue({
      label: '',
      startTime: '06:00',
      endTime: '08:00',
      validFrom: '',
      validTo: '',
    });
    await submit();

    expect(repository.createTimeSlot).not.toHaveBeenCalled();
    expect(text()).toContain('Se cruza con la franja 05:00 – 07:00 (Mañana). Ajusta las horas.');
  });

  it('shows the overlap refused by the API in Spanish and keeps the form', async () => {
    repository.createTimeSlot.mockRejectedValueOnce(
      new ApiError(
        409,
        'time-slot-overlap',
        'La franja se cruza con otra franja de la ruta. Ajusta las horas.',
      ),
    );
    await create();
    await press(button('Agregar franja'));
    slotForm().setValue({
      label: '',
      startTime: '08:00',
      endTime: '09:00',
      validFrom: '',
      validTo: '',
    });

    await submit();

    expect(text()).toContain('La franja se cruza con otra franja de la ruta. Ajusta las horas.');
    expect(root().querySelector('form')).not.toBeNull();
    expect(success).not.toHaveBeenCalled();
  });

  it('edits a slot with its values preloaded, without counting itself as an overlap', async () => {
    await create();

    await press(slotButton('Mañana', 'Editar'));

    expect(document.activeElement?.textContent?.trim()).toBe('Editar franja');
    expect(slotForm().getRawValue()).toEqual({
      label: 'Mañana',
      startTime: '05:00',
      endTime: '07:00',
      validFrom: '',
      validTo: '',
    });
    expect(section().hasUnsavedChanges()).toBe(false);

    slotForm().patchValue({ endTime: '07:30' });
    expect(section().hasUnsavedChanges()).toBe(true);
    await submit();

    expect(repository.updateTimeSlot).toHaveBeenCalledWith('jipiro', 'morning', {
      label: 'Mañana',
      startTime: '05:00',
      endTime: '07:30',
    });
    expect(success).toHaveBeenCalledWith('Franja actualizada.');
    expect(section().hasUnsavedChanges()).toBe(false);
  });

  it('asks before deleting a slot with a destructive button', async () => {
    await create();

    await press(slotButton('18:00', 'Eliminar'));

    expect(confirmAction).toHaveBeenCalledWith(
      expect.objectContaining({ confirmText: 'Eliminar', destructive: true }),
    );
    expect(repository.deleteTimeSlot).toHaveBeenCalledWith('jipiro', 'night');
    expect(repository.get).toHaveBeenCalledTimes(2);
    expect(success).toHaveBeenCalledWith('Franja eliminada.');
  });
});
