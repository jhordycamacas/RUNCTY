import { Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { route, segment, slot } from '../../../routes/domain/testing/fixtures';
import { RouteDetailStore } from '../application/route-detail.store';
import { ManagedRouteDetail, RouteAdminRepository } from '../domain/managed-route';
import {
  FakeRouteAdminRepository,
  fakeRouteAdminRepository,
  managedDetail,
  settle,
} from '../testing/fake-route-admin.repository';
import { SafetySummarySection } from './safety-summary-section';

const FACTOR = {
  type: 'Iluminación deficiente',
  severity: 'high' as const,
  description: 'Sin postes de luz',
  segmentId: 's2',
  segmentName: 'Orilla del río',
};

const detailWith = (nightScore: number): ManagedRouteDetail =>
  managedDetail(
    route('jipiro', {
      safety: [
        slot('morning', '05:00', '07:00', 90),
        { ...slot('night', '18:00', '24:00', nightScore), worstSegmentId: 's2', factors: [FACTOR] },
      ],
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
          endTime: '24:00',
          validFrom: null,
          validTo: null,
        },
      ],
      segments: [
        { ...segment('s1', { name: 'Entrada' }), riskFactors: [] },
        { ...segment('s2', { name: 'Orilla del río', order: 1 }), riskFactors: [] },
      ],
    },
  );

@Component({
  imports: [SafetySummarySection],
  providers: [RouteDetailStore],
  template: `<app-safety-summary-section />`,
})
class Host {
  readonly store = inject(RouteDetailStore);
}

describe('SafetySummarySection', () => {
  let fixture: ComponentFixture<Host>;
  let repository: FakeRouteAdminRepository;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const entries = () => [...root().querySelectorAll('.entry')].map((row) => row.textContent ?? '');

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.componentInstance.store.load('jipiro');
    await settle(fixture);
  }

  beforeEach(() => {
    repository = fakeRouteAdminRepository();
    repository.get.mockResolvedValue(detailWith(25));
    TestBed.configureTestingModule({
      providers: [{ provide: RouteAdminRepository, useValue: repository }],
    });
  });

  it('shows per slot the route level, the worst segment and the factors that explain it', async () => {
    await create();

    expect(entries()).toHaveLength(2);
    expect(entries()[0]).toContain('Mañana (05:00 – 07:00)');
    expect(entries()[0]).toContain('Alto');
    expect(entries()[0]).toContain('Puntaje 90 de 100');
    expect(entries()[0]).toContain('Sin factores de riesgo en esta franja.');
    expect(entries()[1]).toContain('18:00 – 24:00');
    expect(entries()[1]).toContain('Bajo');
    expect(entries()[1]).toContain('Tramo más expuesto: Orilla del río');
    expect(entries()[1]).toContain('Iluminación deficiente');
    expect(entries()[1]).toContain('Severidad Alta');
    expect(entries()[1]).toContain('Sin postes de luz');
    expect(text()).not.toMatch(/segura|insegura/i);
  });

  it('reflects the index the API returns after a change, without a manual reload', async () => {
    await create();
    repository.get.mockResolvedValue(detailWith(55));

    await fixture.componentInstance.store.saveTimeSlot('night', {
      startTime: '18:00',
      endTime: '24:00',
    });
    await settle(fixture);

    expect(entries()[1]).toContain('Medio');
    expect(entries()[1]).toContain('Puntaje 55 de 100');
  });

  it('explains that the index needs time slots when there is none', async () => {
    repository.get.mockResolvedValue(managedDetail(route('jipiro')));

    await create();

    expect(text()).toContain('Agrega franjas horarias para ver el índice de seguridad.');
  });
});
