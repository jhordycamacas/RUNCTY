import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApiError } from '../../core/errors/api-error';
import {
  FakeBackend,
  RUNNER,
  catalogRoutes,
  fakeBackend,
  provideFakeBackend,
  settle,
} from '../../routes/presentation/testing/fake-backend';
import { RiskZoneAlertRepository } from '../domain/risk-zone-alert';
import {
  FakeRiskZoneAlertRepository,
  riskZoneAlert,
} from '../testing/fake-risk-zone-alert.repository';
import { AlertsPage } from './alerts.page';

describe('AlertsPage', () => {
  let fixture: ComponentFixture<AlertsPage>;
  let backend: FakeBackend;
  let repo: FakeRiskZoneAlertRepository;

  const text = () =>
    (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ') ?? '';

  async function create(): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        ...provideFakeBackend(backend),
        { provide: RiskZoneAlertRepository, useValue: repo },
      ],
    });
    fixture = TestBed.createComponent(AlertsPage);
    fixture.detectChanges();
    await settle(fixture);
  }

  beforeEach(() => {
    backend = fakeBackend(catalogRoutes());
    repo = new FakeRiskZoneAlertRepository();
  });

  it('shows the empty state when no alert is in force', async () => {
    await create();

    expect(text()).toContain('No hay alertas activas en tu zona');
    expect(text()).toContain('Cuando se reporte una zona de riesgo en Loja, la verás aquí.');
  });

  it('lists the alerts with their kind, severity, place and schedule', async () => {
    repo.alerts = [riskZoneAlert(), riskZoneAlert({ id: 'a2', type: 'Obras en la vía', severity: 'baja' })];

    await create();

    expect(text()).toContain('2 alertas activas');
    expect(text()).toContain('Robos frecuentes');
    expect(text()).toContain('Riesgo alto');
    expect(text()).toContain('Zona de 300 m de radio');
    expect(text()).toContain('de 18:00 a 21:00');
    expect(text()).toContain('Obras en la vía');
    expect(text()).toContain('Riesgo bajo');
  });

  it('shows a failure with a retry, not the empty state', async () => {
    repo.alerts = new ApiError(0, 'network', 'Sin conexión.');

    await create();

    expect(text()).toContain('Sin conexión.');
    expect(text()).not.toContain('No hay alertas activas');
  });

  it('asks for a city when the profile has none', async () => {
    backend.profile = { ...RUNNER, cityId: '' };

    await create();

    expect(text()).toContain('Elige tu ciudad');
  });
});
