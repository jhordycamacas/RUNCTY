import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    TestBed.configureTestingModule({ providers: provideFakeBackend(backend) });
    fixture = TestBed.createComponent(RunnerHomePage);
    fixture.detectChanges();
    await settle(fixture);
  }

  beforeEach(() => {
    backend = fakeBackend(catalogRoutes());
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
      expect(text()).toContain('4 rutas disponibles');
      expect(root().querySelector('.stats .name')?.textContent?.trim()).toBe('Ruta 90');
    } finally {
      vi.useRealTimers();
    }
  });

  it('offers a big «Empezar a correr» that goes to the Correr tab', async () => {
    await create();

    const cta = root().querySelector('a.cta');
    expect(cta?.textContent).toContain('Empezar a correr');
    expect(cta?.getAttribute('href')).toBe('/app/correr');
  });

  it('orders by the evening slot when that is the next training slot', async () => {
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
