import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_FILTERS, RouteFilters, listTimeSlots } from '../domain/catalog';
import { Route } from '../domain/route';
import { RoutesFilterSheet } from './routes-filter-sheet';
import { catalogRoutes } from './testing/fake-backend';

describe('RoutesFilterSheet', () => {
  let fixture: ComponentFixture<RoutesFilterSheet>;
  let routes: Route[];
  let applied: { slotKey: string | null; filters: RouteFilters }[];
  let closed: number;

  const slotOptions = () =>
    listTimeSlots(routes).map((slot) => ({ value: slot.key, label: slot.label }));
  const body = () => document.body;
  const text = () => body().textContent?.replace(/\s+/g, ' ') ?? '';
  const chip = (label: string) =>
    [...body().querySelectorAll<HTMLButtonElement>('ion-modal button[role=radio]')]
      .filter((el) => el.textContent?.trim() === label)
      .at(0);
  const button = (label: string | RegExp) =>
    [...body().querySelectorAll<HTMLElement>('ion-button')].find((el) =>
      typeof label === 'string'
        ? el.textContent?.trim() === label
        : label.test(el.textContent?.trim() ?? ''),
    );
  const settle = async () => {
    for (let i = 0; i < 4; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      fixture.detectChanges();
    }
  };
  const press = async (element: Element | undefined) => {
    element?.dispatchEvent(new Event('click'));
    await settle();
  };

  async function open(
    overrides: { filters?: RouteFilters; query?: string; slotKey?: string | null } = {},
  ): Promise<void> {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('routes', routes);
    fixture.componentRef.setInput('query', overrides.query ?? '');
    fixture.componentRef.setInput('slotOptions', slotOptions());
    fixture.componentRef.setInput('slotKey', overrides.slotKey ?? '05:00-07:00');
    fixture.componentRef.setInput('defaultSlotKey', '05:00-07:00');
    fixture.componentRef.setInput('filters', overrides.filters ?? DEFAULT_FILTERS);
    fixture.detectChanges();
    await settle();
  }

  beforeEach(() => {
    routes = catalogRoutes();
    applied = [];
    closed = 0;
    fixture = TestBed.createComponent(RoutesFilterSheet);
    fixture.componentInstance.applied.subscribe((value) => applied.push(value));
    fixture.componentInstance.closed.subscribe(() => (closed += 1));
  });

  afterEach(() => fixture.destroy());

  it('offers the time slot, distance, difficulty and surface groups built from the routes', async () => {
    await open();

    for (const label of ['Franja horaria', 'Distancia', 'Dificultad', 'Superficie']) {
      expect(body().querySelector(`[role=radiogroup][aria-label="${label}"]`)).not.toBeNull();
    }
    expect(chip('18:00 – 20:00')).toBeDefined();
    expect(chip('Intermedio')).toBeDefined();
    expect(chip('Mixto')).toBeDefined();
    expect(chip('05:00 – 07:00')?.getAttribute('aria-checked')).toBe('true');
  });

  it('counts the matching routes live, honoring the search text', async () => {
    await open();
    expect(button(/^Ver 3 rutas$/)).toBeDefined();

    await press(chip('Hasta 5 km'));
    expect(button('Ver 1 ruta')).toBeDefined();

    await press(chip('Todas'));
    fixture.componentRef.setInput('query', 'tebaida');
    await settle();
    expect(button('Ver 1 ruta')).toBeDefined();
  });

  it('applies the draft filters and the chosen slot, then closes', async () => {
    await open();

    await press(chip('18:00 – 20:00'));
    await press(chip('Intermedio'));
    await press(button('Ver 1 ruta'));

    expect(applied).toEqual([
      { slotKey: '18:00-20:00', filters: { ...DEFAULT_FILTERS, difficulty: 'Intermedio' } },
    ]);
    expect(closed).toBe(1);
  });

  it('clears the draft back to every route and the default slot without applying', async () => {
    await open({ filters: { ...DEFAULT_FILTERS, distance: 'upTo5' }, slotKey: '18:00-20:00' });
    expect(button('Ver 1 ruta')).toBeDefined();

    await press(button('Limpiar'));

    expect(button('Ver 3 rutas')).toBeDefined();
    expect(chip('05:00 – 07:00')?.getAttribute('aria-checked')).toBe('true');
    expect(applied).toEqual([]);
  });

  it('cannot be applied when no route matches', async () => {
    await open();

    await press(chip('Avanzado'));
    await press(chip('Hasta 5 km'));

    const apply = button('Sin rutas con estos filtros');
    expect(apply).toBeDefined();
    expect(apply?.hasAttribute('disabled')).toBe(true);
  });

  it('closes without applying and forgets the draft when opened again', async () => {
    await open();
    await press(chip('Hasta 5 km'));

    await press(button('Cerrar'));
    expect(applied).toEqual([]);
    expect(closed).toBe(1);

    fixture.componentRef.setInput('open', false);
    await settle();
    await open();
    expect(chip('Hasta 5 km')?.getAttribute('aria-checked')).toBe('false');
    expect(text()).toContain('Ver 3 rutas');
  });
});
