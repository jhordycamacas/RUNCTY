import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CatalogRepository } from '../../../core/catalogs/catalog';
import { fakeCatalogRepository } from '../../../core/catalogs/testing/fake-catalog.repository';
import { ApiError } from '../../../core/errors/api-error';
import { SummaryStore } from '../application/summary.store';
import { SummaryRepository } from '../domain/summary';
import { summaryFixture } from '../testing/summary-fixtures';
import { SummaryPage } from './summary.page';

describe('SummaryPage', () => {
  let get: ReturnType<typeof vi.fn<SummaryRepository['get']>>;

  async function open(): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        SummaryStore,
        { provide: SummaryRepository, useValue: { get } },
        { provide: CatalogRepository, useValue: fakeCatalogRepository() },
      ],
    });
    const fixture = TestBed.createComponent(SummaryPage);
    fixture.componentInstance.ionViewWillEnter();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => {
    get = vi.fn<SummaryRepository['get']>().mockResolvedValue(summaryFixture());
  });

  const section = (page: HTMLElement, title: string): HTMLElement =>
    Array.from(page.querySelectorAll<HTMLElement>('section')).find(
      (el) => el.querySelector('h2')?.textContent?.trim() === title,
    ) as HTMLElement;

  it('opens with four plain-worded number cards from the figures the endpoint returned', async () => {
    const page = await open();
    const cards = Array.from(page.querySelectorAll('.kpis app-kpi-tile')).map((tile) => ({
      label: tile.querySelector('.label')?.textContent?.trim(),
      value: tile.querySelector('.value')?.textContent?.trim(),
      hint: tile.querySelector('.hint')?.textContent?.trim(),
    }));

    expect(cards).toEqual([
      { label: 'Rutas activas', value: '4', hint: 'de 5 rutas · 41,3 km' },
      { label: 'Usuarios registrados', value: '12', hint: '9 nuevos en los últimos 30 días' },
      { label: 'Ciudades con rutas', value: '1', hint: 'de 1 ciudad registrada' },
      { label: 'Usuarios con perfil deportivo', value: '6', hint: 'de 12 usuarios (50 %)' },
    ]);
    expect(page.textContent).not.toMatch(/KPI|pipeline|slice/i);
  });

  it('compares routes and users per city, with a one-line explanation', async () => {
    const card = section(await open(), 'Rutas y usuarios por ciudad');

    expect(card.querySelector('.note')?.textContent).toContain('ciudad');
    expect(card.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      'Rutas y usuarios por ciudad. Loja: Rutas 4, Usuarios 9. Quito: Rutas 1, Usuarios 3',
    );
  });

  it('counts the users per sport level with catalog labels, the raw code of unknown ones and those without a profile', async () => {
    const card = section(await open(), 'Usuarios por nivel deportivo');
    const rows = Array.from(card.querySelectorAll('li')).map((li) => [
      li.querySelector('.name')?.textContent?.trim(),
      li.querySelector('.value')?.textContent?.trim(),
    ]);

    expect(rows).toEqual([
      ['Principiante', '3'],
      ['Avanzado', '2'],
      ['legacy-code', '1'],
      ['Sin perfil deportivo', '6'],
    ]);
  });

  it('words the safety levels and the weekly sign-ups plainly, never as "segura"', async () => {
    const page = await open();
    const safety = section(page, 'Qué tan seguras son las rutas');

    const legend = Array.from(safety.querySelectorAll('.legend .name')).map((el) => el.textContent);
    expect(legend).toEqual(['Alta', 'Media', 'Baja', 'Sin evaluar']);
    expect(section(page, 'Usuarios nuevos por semana')).toBeTruthy();
    expect(page.textContent).not.toMatch(/\bsegura\b|\binsegura\b/i);
  });

  it('keeps the longest routes under a collapsed "Más detalles"', async () => {
    const details = (await open()).querySelector('details') as HTMLDetailsElement;

    expect(details.open).toBe(false);
    expect(details.querySelector('summary')?.textContent?.trim()).toBe('Más detalles');
    expect(details.textContent).toContain('Rutas más largas');
  });

  it('ends with an honest note about what arrives later, with no figures', async () => {
    const note = (await open()).querySelector('.later') as HTMLElement;

    expect(note.textContent).toContain(
      'Próximamente: cuántos usuarios recorren cada ruta (llega con el registro de entrenamientos).',
    );
    expect(note.querySelector('.value')).toBeNull();
  });

  it('does not crash when the new lists are missing from an older answer', async () => {
    const old = summaryFixture();
    get.mockResolvedValue({
      ...old,
      byCity: null,
      users: old.users && { ...old.users, bySportLevel: [] },
    });

    const page = await open();

    expect(page.textContent).not.toContain('Rutas y usuarios por ciudad');
    expect(page.textContent).toContain('Sin perfil deportivo');
  });

  it('does not draw the blocks the caller may not see', async () => {
    get.mockResolvedValue(summaryFixture({ users: null, cities: null }));

    const page = await open();

    expect(page.textContent).not.toContain('Usuarios nuevos por semana');
    expect(page.textContent).toContain('Rutas activas');
  });

  it('says so when the caller may see no block', async () => {
    get.mockResolvedValue(summaryFixture({ users: null, routes: null, cities: null }));

    const page = await open();

    expect(page.textContent).toContain('no tiene secciones con datos');
  });

  it('warns that the figures are a minimum when a scan was truncated', async () => {
    get.mockResolvedValue(summaryFixture({ truncated: true }));

    expect((await open()).textContent).toContain('las cifras son un mínimo');
  });

  it('shows the error with a retry that loads again', async () => {
    get.mockRejectedValueOnce(new ApiError(500, 'internal', 'No pudimos cargar.'));
    const page = await open();
    expect(page.textContent).toContain('No pudimos cargar.');

    const retry = Array.from(page.querySelectorAll('ion-button')).find(
      (button) => button.textContent?.trim() === 'Reintentar',
    ) as HTMLElement;
    retry.click();
    await TestBed.inject(SummaryStore).load();

    expect(get).toHaveBeenCalledTimes(3);
  });

  it('shows a skeleton while the first load is pending', async () => {
    get.mockReturnValue(new Promise(() => undefined));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        SummaryStore,
        { provide: SummaryRepository, useValue: { get } },
        { provide: CatalogRepository, useValue: fakeCatalogRepository() },
      ],
    });
    const fixture = TestBed.createComponent(SummaryPage);
    fixture.componentInstance.ionViewWillEnter();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.skeleton[aria-busy="true"]')).not.toBeNull();
  });
});
