import { Component, computed, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { ApiError } from '../../../core/errors/api-error';
import { route, segment } from '../../../routes/domain/testing/fixtures';
import { ConfirmActionOptions, ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../shared/ui/toast.service';
import { RouteDetailStore } from '../application/route-detail.store';
import { ManagedRouteDetail, RouteAdminRepository } from '../domain/managed-route';
import {
  FakeRouteAdminRepository,
  fakeRouteAdminRepository,
  managedDetail,
  settle,
} from '../testing/fake-route-admin.repository';
import { RiskFactorsSection } from './risk-factors-section';

const DETAIL: ManagedRouteDetail = managedDetail(route('jipiro'), {
  segments: [
    {
      ...segment('s1', { name: 'Orilla' }),
      riskFactors: [
        {
          id: 'f1',
          type: 'Iluminación deficiente',
          severity: 'high',
          description: 'Sin postes de luz',
          startTime: '18:00',
          endTime: '24:00',
        },
        {
          id: 'f2',
          type: 'Tráfico',
          severity: 'low',
          description: 'Cruce concurrido',
          startTime: null,
          endTime: null,
        },
      ],
    },
  ],
});

@Component({
  imports: [RiskFactorsSection],
  providers: [RouteDetailStore],
  template: `@if (segment(); as current) {
    <app-risk-factors [segment]="current" />
  }`,
})
class Host {
  readonly store = inject(RouteDetailStore);
  readonly segment = computed(() => this.store.detail()?.segments[0]);
}

describe('RiskFactorsSection', () => {
  let fixture: ComponentFixture<Host>;
  let repository: FakeRouteAdminRepository;
  let confirmAction: ReturnType<typeof vi.fn<ConfirmDialog['confirmAction']>>;
  let success: ReturnType<typeof vi.fn<ToastService['success']>>;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const section = () =>
    fixture.debugElement.query(By.directive(RiskFactorsSection))
      .componentInstance as RiskFactorsSection;
  const factorForm = () => section()['form'];
  const button = (label: string, scope: Element = root()) =>
    [...scope.querySelectorAll('ion-button')].find((el) => el.textContent?.trim() === label);
  const factorButton = (description: string, label: string) =>
    button(
      label,
      [...root().querySelectorAll('.factor')].find((row) =>
        row.textContent?.includes(description),
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
    TestBed.configureTestingModule({
      providers: [
        { provide: RouteAdminRepository, useValue: repository },
        { provide: ConfirmDialog, useValue: { confirmAction, confirm: async () => true } },
        { provide: ToastService, useValue: { success } },
      ],
    });
  });

  it('lists the factors of the segment with type, severity and daily window', async () => {
    await create();

    const rows = [...root().querySelectorAll('.factor')].map((row) => row.textContent ?? '');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('Iluminación deficiente');
    expect(rows[0]).toContain('Severidad Alta');
    expect(rows[0]).toContain('18:00 – 24:00');
    expect(rows[0]).toContain('Sin postes de luz');
    expect(rows[1]).toContain('Tráfico');
    expect(rows[1]).toContain('Severidad Baja');
    expect(rows[1]).toContain('Todo el día');
  });

  it('says so when the segment has no factors', async () => {
    repository.get.mockResolvedValue({
      ...DETAIL,
      segments: [{ ...DETAIL.segments[0], riskFactors: [] }],
    });

    await create();

    expect(text()).toContain('Sin factores de riesgo registrados.');
  });

  it('adds a factor, moving the focus to the form and sending only the filled fields', async () => {
    await create();

    await press(button('Agregar factor'));

    expect(document.activeElement?.textContent?.trim()).toBe('Nuevo factor de riesgo');
    expect(root().querySelectorAll('form input[type="time"]')).toHaveLength(2);
    factorForm().setValue({
      type: 'Zona solitaria',
      severity: 'medium',
      description: ' Tramo sin casas ',
      startTime: '',
      endTime: '',
    });
    await submit();

    expect(repository.createRiskFactor).toHaveBeenCalledWith('jipiro', 's1', {
      type: 'Zona solitaria',
      severity: 'medium',
      description: 'Tramo sin casas',
    });
    expect(repository.get).toHaveBeenCalledTimes(2);
    expect(success).toHaveBeenCalledWith('Factor de riesgo agregado.');
    expect(root().querySelector('form')).toBeNull();
  });

  it('shows the field messages in Spanish and sends nothing when the factor is invalid', async () => {
    await create();
    await press(button('Agregar factor'));

    factorForm().setValue({
      type: '',
      severity: 'high',
      description: 'x',
      startTime: '20:00',
      endTime: '',
    });
    await submit();

    expect(repository.createRiskFactor).not.toHaveBeenCalled();
    expect(text()).toContain('Escribe el tipo de factor, por ejemplo Iluminación deficiente.');
    expect(text()).toContain('Completa ambas horas o deja las dos vacías (todo el día).');
  });

  it('edits a factor with its values preloaded', async () => {
    await create();

    await press(factorButton('Sin postes de luz', 'Editar'));

    expect(document.activeElement?.textContent?.trim()).toBe('Editar factor de riesgo');
    expect(factorForm().getRawValue()).toEqual({
      type: 'Iluminación deficiente',
      severity: 'high',
      description: 'Sin postes de luz',
      startTime: '18:00',
      endTime: '00:00',
    });
    expect(section().hasUnsavedChanges()).toBe(false);

    factorForm().patchValue({ severity: 'medium' });
    expect(section().hasUnsavedChanges()).toBe(true);
    await submit();

    expect(repository.updateRiskFactor).toHaveBeenCalledWith('jipiro', 's1', 'f1', {
      type: 'Iluminación deficiente',
      severity: 'medium',
      description: 'Sin postes de luz',
      startTime: '18:00',
      endTime: '24:00',
    });
    expect(success).toHaveBeenCalledWith('Factor de riesgo actualizado.');
    expect(section().hasUnsavedChanges()).toBe(false);
  });

  it('shows the API refusal in Spanish and keeps the form', async () => {
    repository.createRiskFactor.mockRejectedValueOnce(
      new ApiError(409, 'too-many-risk-factors', 'Un tramo admite máximo 20 factores de riesgo.'),
    );
    await create();
    await press(button('Agregar factor'));
    factorForm().setValue({
      type: 'Perros sueltos',
      severity: 'low',
      description: 'Perros sueltos',
      startTime: '',
      endTime: '',
    });

    await submit();

    expect(text()).toContain('Un tramo admite máximo 20 factores de riesgo.');
    expect(root().querySelector('form')).not.toBeNull();
  });

  it('asks before deleting a factor with a destructive button', async () => {
    await create();

    await press(factorButton('Cruce concurrido', 'Eliminar'));

    expect(confirmAction).toHaveBeenCalledWith(
      expect.objectContaining({ confirmText: 'Eliminar', destructive: true }),
    );
    expect(repository.deleteRiskFactor).toHaveBeenCalledWith('jipiro', 's1', 'f2');
    expect(repository.get).toHaveBeenCalledTimes(2);
    expect(success).toHaveBeenCalledWith('Factor de riesgo eliminado.');
  });
});
