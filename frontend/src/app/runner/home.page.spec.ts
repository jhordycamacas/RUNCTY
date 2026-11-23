import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RiskZoneAlertRepository } from '../alerts/domain/risk-zone-alert';
import {
  FakeRiskZoneAlertRepository,
  riskZoneAlert,
} from '../alerts/testing/fake-risk-zone-alert.repository';
import { ApiError } from '../core/errors/api-error';
import { route, slot } from '../routes/domain/testing/fixtures';
import {
  FakeBackend,
  RUNNER,
  catalogRoutes,
  fakeBackend,
  provideFakeBackend,
  settle,
} from '../routes/presentation/testing/fake-backend';
import { RunnerHomePage } from './home.page';

describe('RunnerHomePage recommended routes', () => {
  let fixture: ComponentFixture<RunnerHomePage>;
  let backend: FakeBackend;
  let alerts: FakeRiskZoneAlertRepository;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () =>
    root()
      .innerHTML.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ');
  const names = () =>
    [...root().querySelectorAll('app-route-card .name')].map((el) => el.textContent?.trim());
  const retry = () =>
    [...root().querySelectorAll('ion-button')].find(
      (el) => el.textContent?.trim() === 'Reintentar',
    );

  async function create(): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        ...provideFakeBackend(backend),
        { provide: RiskZoneAlertRepository, useValue: alerts },
      ],
    });
    fixture = TestBed.createComponent(RunnerHomePage);
    fixture.detectChanges();
    await settle(fixture);
  }

  beforeEach(() => {
    backend = fakeBackend(catalogRoutes());
    alerts = new FakeRiskZoneAlertRepository();
  });

  it('greets the runner and shows the routes ordered by safety for the next slot', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 2, 6, 0));
    backend.routes = [40, 90, 70, 60].map((score, index) =>
      route(`r${index}`, {
        name: `Ruta ${score}`,
        safety: [slot('m', '05:00', '07:00', score)],
      }),
    );
    try {
      await create();

      expect(text()).toContain('Hola, Ana');
      expect(text()).toContain('Tu ciudad: Loja');
      expect(text()).toContain('Nivel de seguridad para la franja de 05:00 – 07:00');
      expect(names()).toEqual(['Ruta 90', 'Ruta 70', 'Ruta 60']);
      expect(text()).not.toContain('rutas disponibles');
    } finally {
      vi.useRealTimers();
    }
  });

  it('offers a modest «Correr» shortcut instead of the big «Empezar a correr» hero', async () => {
    await create();

    const shortcut = root().querySelector('a.run-shortcut');
    expect(shortcut?.textContent?.trim()).toBe('Correr');
    expect(shortcut?.getAttribute('href')).toBe('/app/correr');
    expect(text()).not.toContain('Empezar a correr');
  });

  it('shows a «Novedades» block with the zone alerts and the safest route', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 2, 6, 0));
    backend.routes = [route('r1', { name: 'Ruta 90', safety: [slot('m', '05:00', '07:00', 90)] })];
    alerts.alerts = [riskZoneAlert(), riskZoneAlert({ id: 'a2', type: 'Obras en la vía' })];
    try {
      await create();

      const novedades = root().querySelector('section[aria-labelledby="news-title"]');
      expect(novedades?.querySelector('h2')?.textContent).toContain('Novedades');
      const cards = [...(novedades?.querySelectorAll('a.news-card') ?? [])];
      expect(cards.map((card) => card.getAttribute('href'))).toEqual([
        '/app/notificaciones',
        '/app/notificaciones',
        '/app/rutas/r1',
      ]);
      expect(novedades?.textContent).toContain('Robos frecuentes');
      expect(novedades?.textContent).toContain('Obras en la vía');
      expect(novedades?.textContent).toContain('Ruta 90');
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaves out the «Novedades» block when there is nothing new', async () => {
    backend.routes = [];

    await create();

    expect(root().querySelector('section[aria-labelledby="news-title"]')).toBeNull();
  });

  it('orders by the evening slot when that is the next window to start', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 2, 12, 0));
    try {
      await create();

      expect(names()[0]).toBe('Parque Lineal La Tebaida');
      expect(text()).toContain('18:00 – 20:00');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows a loading state while the routes arrive', async () => {
    backend.routes = new Promise<never>(() => undefined);

    await create();

    expect(text()).toContain('Cargando rutas…');
    expect(text()).not.toContain('Aún no hay rutas');
  });

  it('shows a load error with a retry instead of "no routes"', async () => {
    backend.routes = new ApiError(0, 'network', 'No hay conexión con el servidor.');
    await create();

    expect(text()).toContain('No hay conexión con el servidor.');
    expect(text()).not.toContain('Aún no hay rutas');

    backend.routes = catalogRoutes();
    retry()?.dispatchEvent(new Event('click'));
    await settle(fixture);

    expect(names()).toHaveLength(3);
  });

  it('shows a profile-load error with a retry', async () => {
    backend.profile = new ApiError(0, 'network', 'Sin conexión.');
    await create();
    expect(text()).toContain('Sin conexión.');

    backend.profile = RUNNER;
    retry()?.dispatchEvent(new Event('click'));
    await settle(fixture);

    expect(text()).toContain('Hola, Ana');
  });

  it('asks for a city when the profile has none', async () => {
    backend.profile = { ...RUNNER, cityId: '' };

    await create();

    expect(text()).toContain('Elige tu ciudad');
    expect(text()).not.toContain('Aún no hay rutas');
    expect(names()).toEqual([]);
  });

  it('says the city has no routes only when the list really came back empty', async () => {
    backend.routes = [];

    await create();

    expect(text()).toContain('Aún no hay rutas en Loja');
  });
});
