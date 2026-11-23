import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ApiError } from '../../core/errors/api-error';
import { FakeMapRenderer, provideFakeMapRenderer } from '../../shared/map/testing/fake-map-renderer';
import { Segment } from '../domain/route';
import {
  catalogRoutes,
  fakeBackend,
  provideFakeBackend,
  settle,
  FakeBackend,
} from './testing/fake-backend';
import { RouteDetailPage } from './route-detail.page';

const SEGMENTS: Segment[] = [
  {
    id: 's1',
    name: 'Entrada al lago',
    order: 0,
    coordinates: [
      { lat: -3.97, lng: -79.2 },
      { lat: -3.971, lng: -79.201 },
    ],
    lengthM: 850,
    safety: {
      morning: { level: 'high', score: 95, factors: [] },
      evening: {
        level: 'medium',
        score: 60,
        factors: [{ type: 'Tráfico', severity: 'medium', description: 'Cruce de avenida' }],
      },
    },
  },
  {
    id: 's2',
    name: 'Orilla del río',
    order: 1,
    coordinates: [{ lat: -3.98, lng: -79.2 }],
    lengthM: 2350,
    safety: { morning: { level: 'high', score: 90, factors: [] } },
  },
];

describe('RouteDetailPage', () => {
  let fixture: ComponentFixture<RouteDetailPage>;
  let backend: FakeBackend;
  let map: FakeMapRenderer;

  const root = () => fixture.nativeElement as HTMLElement;
  /** The visible text with a space where an element ends, so labels and values stay apart. */
  const text = () =>
    root()
      .innerHTML.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ');

  async function create(slot: string | null = '05:00-07:00'): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        ...provideFakeBackend(backend),
        provideFakeMapRenderer(map),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'jipiro' }),
              queryParamMap: convertToParamMap(slot ? { franja: slot } : {}),
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(RouteDetailPage);
    fixture.detectChanges();
    await settle(fixture);
  }

  beforeEach(() => {
    const routes = catalogRoutes();
    backend = fakeBackend(routes);
    backend.detail = { route: routes[0], segments: SEGMENTS };
    map = new FakeMapRenderer();
  });

  it('draws the route on the map, each segment in the color of its level for the slot', async () => {
    await create('18:00-20:00');

    expect(root().querySelector('app-map-view')?.getAttribute('aria-label')).toBe(
      'Mapa de la ruta',
    );
    expect(map.scene?.lines.map((line) => line.tone)).toEqual(['caution', 'route']);
    expect(map.scene?.lines[0].points).toEqual(SEGMENTS[0].coordinates);
    expect(map.scene?.markers).toEqual([
      { kind: 'start', at: { lat: -3.97, lng: -79.2 } },
      { kind: 'end', at: { lat: -3.98, lng: -79.2 } },
    ]);
  });

  describe('custom image', () => {
    const THUMB = 'data:image/jpeg;base64,AAAA';
    const FULL = 'data:image/jpeg;base64,BBBBBBBB';
    const hero = () => root().querySelector('img.hero') as HTMLImageElement | null;

    beforeEach(() => {
      const route = { ...catalogRoutes()[0], imageThumb: THUMB };
      backend.detail = { route, segments: SEGMENTS };
    });

    it('shows no image for a route without one', async () => {
      backend.detail = { route: catalogRoutes()[0], segments: SEGMENTS };

      await create();

      expect(hero()).toBeNull();
    });

    it('shows the full image above the name', async () => {
      backend.image = FULL;

      await create();

      expect(hero()?.getAttribute('src')).toBe(FULL);
      expect(hero()?.alt).toBe('Imagen de Parque Jipiro');
    });

    it('keeps the thumbnail when the full image cannot be loaded', async () => {
      backend.image = new ApiError(0, 'network', 'sin conexión');

      await create();

      expect(hero()?.getAttribute('src')).toBe(THUMB);
      expect(text()).not.toContain('sin conexión');
    });
  });

  it('shows no map for a route without points', async () => {
    backend.detail = { route: catalogRoutes()[0], segments: [] };

    await create();

    expect(root().querySelector('app-map-view')).toBeNull();
  });

  it('shows the key stats, start and end and the disclaimer', async () => {
    await create();

    expect(text()).toContain('Parque Jipiro');
    expect(text()).toContain('Distancia 3,2 km');
    expect(text()).toContain('Desnivel 15 m');
    expect(text()).toContain('Dificultad Principiante');
    expect(text()).toContain('Superficie Asfalto');
    expect(text()).toContain('Entrada principal');
    expect(text()).toContain('Puente sur');
    expect(text()).toContain(
      'El nivel de seguridad es una estimación según los factores registrados. No garantiza seguridad absoluta.',
    );
  });

  it('follows the units preference', async () => {
    backend.preferences.update((p) => ({ ...p, units: 'imperial' }));

    await create();

    expect(text()).toContain('Distancia 2 mi');
    expect(text()).toContain('Desnivel 49 ft');
  });

  it('opens the start point in Google Maps through a plain external link', async () => {
    await create();

    const link = root().querySelector('a.maps') as HTMLAnchorElement;

    expect(link.textContent).toContain('Abrir en Google Maps');
    expect(link.getAttribute('href')).toBe(
      'https://www.google.com/maps/search/?api=1&query=-3.97,-79.2',
    );
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('hides the map link when the route has no start point', async () => {
    backend.detail = { route: { ...catalogRoutes()[0], start: null }, segments: [] };

    await create();

    expect(root().querySelector('a.maps')).toBeNull();
  });

  it('summarizes a slot without factors', async () => {
    await create('05:00-07:00');

    expect(text()).toContain('Seguridad: Alto');
    expect(text()).toContain('Puntaje 90 de 100');
    expect(text()).toContain('No hay factores de riesgo registrados para esta franja');
  });

  it('explains the level with its factors when switching slots', async () => {
    await create('05:00-07:00');

    const evening = [...root().querySelectorAll<HTMLButtonElement>('button[role=radio]')].find(
      (el) => el.textContent?.trim() === '18:00 – 20:00',
    );
    evening?.dispatchEvent(new Event('click'));
    await settle(fixture);

    expect(text()).toContain('Seguridad: Bajo');
    expect(text()).toContain('Puntaje 30 de 100');
    expect(text()).toContain('Por qué este nivel');
    expect(text()).toContain(
      'Severidad alta Iluminación deficiente Postes apagados Tramo: Orilla del río',
    );
  });

  it('lists the segments in order with their level for the slot', async () => {
    await create('18:00-20:00');

    expect(text()).toContain('1. Entrada al lago');
    expect(text()).toContain('2. Orilla del río');
    expect(text()).toContain('850 m · 2 puntos');
    expect(text()).toContain('2,4 km · 1 punto');
    expect(text()).toContain('Tráfico Cruce de avenida');
    expect(text()).toContain('Medio');
    expect(text()).toContain('Sin evaluar');
  });

  it('marks a route without any evaluation', async () => {
    backend.detail = { route: catalogRoutes()[2], segments: [] };

    await create(null);

    expect(text()).toContain('Esta ruta aún no tiene una evaluación de seguridad.');
    expect(text()).toContain('Esta ruta aún no tiene tramos registrados.');
  });

  it('shows an error with a retry when the route cannot load', async () => {
    backend.detail = new ApiError(0, 'network', 'No hay conexión con el servidor.');
    await create();
    expect(text()).toContain('No hay conexión con el servidor.');

    backend.detail = { route: catalogRoutes()[0], segments: SEGMENTS };
    root().querySelector('ion-button')?.dispatchEvent(new Event('click'));
    await settle(fixture);

    expect(text()).toContain('Parque Jipiro');
  });

  it('tells the runner when the route is gone', async () => {
    backend.detail = new ApiError(404, 'route-not-found', 'La ruta ya no existe.');

    await create();

    expect(text()).toContain('Esta ruta ya no está disponible');
    expect(text()).toContain('Ver todas las rutas');
  });
});
