import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionSheetController } from '@ionic/angular';
import { ApiError } from '../../core/errors/api-error';
import { RoutesListPage } from './routes-list.page';
import {
  FakeBackend,
  RUNNER,
  catalogRoutes,
  fakeBackend,
  provideFakeBackend,
} from './testing/fake-backend';

interface SortSheet {
  buttons: { text: string; handler?: () => void }[];
}

describe('RoutesListPage', () => {
  let fixture: ComponentFixture<RoutesListPage>;
  let backend: FakeBackend;
  let sortSheet: SortSheet | null;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const names = () =>
    [...root().querySelectorAll('app-route-card .name')].map((el) => el.textContent?.trim());
  /** Lets the stores' promises, the effects and the sheet animation settle, then renders. */
  const settle = async () => {
    for (let i = 0; i < 5; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      fixture.detectChanges();
    }
  };
  const press = async (element: Element | undefined) => {
    element?.dispatchEvent(new Event('click'));
    await settle();
  };
  const buttonWithText = (label: string) =>
    [...root().querySelectorAll('ion-button')].find((el) => el.textContent?.trim() === label);
  /** Chips of the filter sheet (the modal lives outside the page element). */
  const chip = (label: string) =>
    [...document.querySelectorAll<HTMLButtonElement>('ion-modal button[role=radio]')].find(
      (el) => el.textContent?.trim() === label,
    ) as HTMLButtonElement;
  const sheetButton = (label: string | RegExp) =>
    [...document.querySelectorAll<HTMLElement>('ion-modal ion-button')].find((el) =>
      typeof label === 'string'
        ? el.textContent?.trim() === label
        : label.test(el.textContent?.trim() ?? ''),
    );
  const tool = (label: RegExp) =>
    [...root().querySelectorAll<HTMLButtonElement>('button.tool')].find((el) =>
      label.test(el.textContent?.trim() ?? ''),
    );
  const search = async (value: string) => {
    const input = root().querySelector<HTMLInputElement>('input[type=search]') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
  };
  const openSheet = () => press(tool(/^Filtros/));
  const applyInSheet = async (...labels: string[]) => {
    await openSheet();
    for (const label of labels) await press(chip(label));
    await press(sheetButton(/^Ver \d+ ruta/));
  };

  async function create(): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        ...provideFakeBackend(backend),
        {
          provide: ActionSheetController,
          useValue: {
            create: async (options: SortSheet) => {
              sortSheet = options;
              return { present: async () => undefined };
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(RoutesListPage);
    fixture.detectChanges();
    await settle();
  }

  beforeEach(() => {
    // Before the first window, so the default slot is the 05:00 one whatever the real hour is.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 2, 4, 0));
    sortSheet = null;
    backend = fakeBackend(catalogRoutes());
  });

  afterEach(() => {
    fixture?.destroy();
    vi.useRealTimers();
  });

  it('asks the runner to complete the profile when there is no city', async () => {
    backend.profile = { ...RUNNER, cityId: '' };

    await create();

    expect(text()).toContain('Elige tu ciudad');
    expect(buttonWithText('Completar perfil')).toBeDefined();
    expect(names()).toEqual([]);
  });

  it('shows skeleton cards while the routes arrive', async () => {
    backend.routes = new Promise<never>(() => undefined);

    await create();

    expect(text()).toContain('Cargando rutas…');
    expect(root().querySelector('[role=status]')).not.toBeNull();
    expect(root().querySelectorAll('app-route-card-skeleton')).toHaveLength(3);
    expect(text()).not.toContain('Aún no hay rutas');
    expect(root().querySelector('input[type=search]')).toBeNull();
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
    expect(root().querySelector('input[type=search]')).toBeNull();
  });

  it('shows only the city, a search, Filtros and Ordenar above the routes', async () => {
    await create();

    expect(text()).toContain('Loja');
    expect(root().querySelector('input[type=search]')).not.toBeNull();
    expect(tool(/^Filtros$/)).toBeDefined();
    expect(tool(/^Ordenar$/)).toBeDefined();
    expect(root().querySelectorAll('app-choice-chips')).toHaveLength(0);
  });

  it('counts the routes shown', async () => {
    await create();
    expect(root().querySelector('.count')?.textContent?.trim()).toBe('3 rutas · Loja');

    await search('tebaida');
    expect(root().querySelector('.count')?.textContent?.trim()).toBe('1 ruta · Loja');
  });

  it('lists the routes with their level for the slot of the sheet, best first', async () => {
    await create();
    expect(names()).toEqual(['Parque Jipiro', 'Parque Lineal La Tebaida', 'Ruta nueva']);
    expect(text()).toContain('Seguridad: Alto');
    expect(text()).toContain('Sin evaluar en esta franja');

    await applyInSheet('18:00 – 20:00');

    expect(names()).toEqual(['Parque Lineal La Tebaida', 'Parque Jipiro', 'Ruta nueva']);
    expect(text()).toContain('Seguridad: Bajo');
    expect(text()).toContain('Factor principal: Iluminación deficiente en Orilla del río');
  });

  it('recolors the preview of every card with the slot chosen in the sheet', async () => {
    await create();
    const tones = () =>
      [...root().querySelectorAll('app-route-card app-route-preview svg')].map((svg) =>
        svg.getAttribute('class'),
      );
    expect(tones()).toEqual(['tone-high', 'tone-medium']);

    await applyInSheet('18:00 – 20:00');

    expect(tones()).toEqual(['tone-high', 'tone-low']);
  });

  it('searches by name ignoring case and accents', async () => {
    await create();

    await search('JIPIRO');
    expect(names()).toEqual(['Parque Jipiro']);

    await search('lineal  ');
    expect(names()).toEqual(['Parque Lineal La Tebaida']);

    await search('');
    expect(names()).toHaveLength(3);
  });

  it('opens on the window in progress or the next one to start', async () => {
    vi.setSystemTime(new Date(2026, 10, 2, 19, 0));

    await create();

    expect(names()[0]).toBe('Parque Lineal La Tebaida');
    await openSheet();
    expect(chip('18:00 – 20:00').getAttribute('aria-checked')).toBe('true');
  });

  it('filters from the sheet, counts them on the button and removes them one by one', async () => {
    await create();

    await applyInSheet('Hasta 5 km');
    expect(names()).toEqual(['Parque Jipiro']);
    expect(tool(/^Filtros · 1$/)).toBeDefined();
    expect(
      [...root().querySelectorAll('.active button')].map((el) => el.getAttribute('aria-label')),
    ).toEqual(['Quitar filtro Hasta 5 km']);

    await applyInSheet('Asfalto');
    expect(tool(/^Filtros · 2$/)).toBeDefined();

    await press(root().querySelector('.active button') ?? undefined);

    expect(tool(/^Filtros · 1$/)).toBeDefined();
    expect(names()).toEqual(['Parque Jipiro', 'Ruta nueva']);
  });

  it('opens the sheet with what is in effect and discards what was not applied', async () => {
    await create();
    await applyInSheet('Hasta 5 km');

    await openSheet();
    expect(chip('Hasta 5 km').getAttribute('aria-checked')).toBe('true');
    await press(chip('Más de 10 km'));
    await press(sheetButton('Cerrar'));

    expect(names()).toEqual(['Parque Jipiro']);
  });

  it('says so when search and filters leave nothing, and clears both from there', async () => {
    await create();
    await applyInSheet('Hasta 5 km');
    await search('tebaida');

    expect(text()).toContain('Ninguna ruta coincide');
    expect(names()).toEqual([]);

    await press(buttonWithText('Quitar filtros'));

    expect(names()).toHaveLength(3);
    expect(root().querySelector<HTMLInputElement>('input[type=search]')?.value).toBe('');
    expect(tool(/^Filtros$/)).toBeDefined();
  });

  it('sorts from the Ordenar sheet and shows the choice on the button', async () => {
    await create();

    await press(tool(/^Ordenar$/));
    expect(sortSheet?.buttons.map((b) => b.text)).toEqual([
      'Más segura',
      'Distancia',
      'Nombre',
      'Cancelar',
    ]);

    sortSheet?.buttons.find((b) => b.text === 'Nombre')?.handler?.();
    await settle();
    expect(names()).toEqual(['Parque Jipiro', 'Parque Lineal La Tebaida', 'Ruta nueva']);
    expect(tool(/^Ordenar · Nombre$/)).toBeDefined();

    await press(tool(/^Ordenar/));
    sortSheet?.buttons.find((b) => b.text === 'Distancia')?.handler?.();
    await settle();
    expect(tool(/^Ordenar · Distancia$/)).toBeDefined();
    expect(names()).toEqual(['Parque Jipiro', 'Parque Lineal La Tebaida', 'Ruta nueva']);

    sortSheet?.buttons.find((b) => b.text === 'Más segura')?.handler?.();
    await settle();
    expect(tool(/^Ordenar$/)).toBeDefined();
  });

  it('links every card to its detail carrying the selected slot', async () => {
    await create();
    await applyInSheet('18:00 – 20:00');

    const link = root().querySelector('app-route-card a') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toContain('/app/rutas/tebaida');
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toContain('franja=18:00-20:00');
  });

  it('asks the API again on pull-to-refresh, keeps search and filters, and ends the gesture', async () => {
    await create();
    await applyInSheet('Hasta 5 km');
    await search('parque');
    const complete = vi.fn().mockResolvedValue(undefined);

    await (
      fixture.componentInstance as unknown as {
        refresh(event: unknown): Promise<void>;
      }
    ).refresh({ detail: { complete } });
    await settle();

    expect(backend.requests.routes).toBe(2);
    expect(complete).toHaveBeenCalledOnce();
    expect(names()).toEqual(['Parque Jipiro']);
  });
});
