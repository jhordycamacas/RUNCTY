import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApiError } from '../../core/errors/api-error';
import { RoutesListPage } from './routes-list.page';
import {
  FakeBackend,
  catalogRoutes,
  fakeBackend,
  provideFakeBackend,
  settle,
} from './testing/fake-backend';

describe('RoutesListPage', () => {
  let fixture: ComponentFixture<RoutesListPage>;
  let backend: FakeBackend;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const names = () =>
    [...root().querySelectorAll('app-route-card .name')].map((el) => el.textContent?.trim());
  const chip = (label: string) =>
    [...root().querySelectorAll<HTMLButtonElement>('button[role=radio]')].find(
      (el) => el.textContent?.trim() === label,
    ) as HTMLButtonElement;
  const press = async (element: Element | undefined) => {
    element?.dispatchEvent(new Event('click'));
    await settle(fixture);
  };
  const buttonWithText = (label: string) =>
    [...root().querySelectorAll('ion-button')].find((el) => el.textContent?.trim() === label);

  async function create(): Promise<void> {
    TestBed.configureTestingModule({ providers: provideFakeBackend(backend) });
    fixture = TestBed.createComponent(RoutesListPage);
    fixture.detectChanges();
    await settle(fixture);
  }

  beforeEach(() => {
    backend = fakeBackend(catalogRoutes());
  });

  it('asks the runner to complete the profile when there is no city', async () => {
    backend.profile = { ...(backend.profile as object), cityId: null } as never;

    await create();

    expect(text()).toContain('Elige tu ciudad');
    expect(buttonWithText('Completar perfil')).toBeDefined();
    expect(names()).toEqual([]);
  });

  it('shows a loading state while the routes arrive', async () => {
    backend.routes = new Promise<never>(() => undefined);

    await create();

    expect(text()).toContain('Cargando rutas…');
    expect(text()).not.toContain('Aún no hay rutas');
  });

  it('shows the error with a retry, not an empty catalogue', async () => {
    backend.routes = new ApiError(0, 'network', 'No hay conexión con el servidor.');
    await create();

    expect(text()).toContain('No pudimos cargar las rutas');
    expect(text()).toContain('No hay conexión con el servidor.');
    expect(text()).not.toContain('Aún no hay rutas');

    backend.routes = catalogRoutes();
    await press(buttonWithText('Reintentar'));

    expect(names()).toHaveLength(3);
    expect(text()).not.toContain('No pudimos cargar las rutas');
  });

  it('says so when the city has no routes yet', async () => {
    backend.routes = [];
    await create();

    expect(text()).toContain('Aún no hay rutas en Loja');
  });

  it('lists the routes with their level for the selected slot, best first', async () => {
    await create();

    await press(chip('05:00 – 07:00'));
    expect(names()).toEqual(['Parque Jipiro', 'Parque Lineal La Tebaida', 'Ruta nueva']);
    expect(text()).toContain('Seguridad: Alto');
    expect(text()).toContain('Sin evaluar en esta franja');

    await press(chip('18:00 – 20:00'));
    expect(names()).toEqual(['Parque Lineal La Tebaida', 'Parque Jipiro', 'Ruta nueva']);
    expect(text()).toContain('Seguridad: Bajo');
    expect(text()).toContain('Factor principal: Iluminación deficiente en Orilla del río');
  });

  it('opens on the slot of the current or next training slot', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 2, 19, 0));
    try {
      await create();

      expect(chip('18:00 – 20:00').getAttribute('aria-checked')).toBe('true');
      expect(names()[0]).toBe('Parque Lineal La Tebaida');
    } finally {
      vi.useRealTimers();
    }
  });

  it('filters by distance and difficulty with horizontally scrolling chips, and clears them', async () => {
    await create();
    expect(root().querySelectorAll('app-choice-chips')).toHaveLength(3);

    await press(chip('Hasta 5 km'));
    expect(names()).toEqual(['Parque Jipiro']);
    expect(chip('Hasta 5 km').getAttribute('aria-checked')).toBe('true');

    await press(chip('Avanzado'));
    expect(text()).toContain('Ninguna ruta coincide con los filtros');

    await press(buttonWithText('Quitar filtros'));
    expect(names()).toHaveLength(3);
  });

  it('links every card to its detail carrying the selected slot', async () => {
    await create();
    await press(chip('18:00 – 20:00'));

    const link = root().querySelector('app-route-card a') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toContain('/app/rutas/tebaida');
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toContain('franja=18:00-20:00');
  });

  it('asks the API again on pull-to-refresh and ends the gesture', async () => {
    await create();
    const complete = vi.fn().mockResolvedValue(undefined);

    await (
      fixture.componentInstance as unknown as {
        refresh(event: unknown): Promise<void>;
      }
    ).refresh({ detail: { complete } });

    expect(backend.requests.routes).toBe(2);
    expect(complete).toHaveBeenCalledOnce();
  });
});
