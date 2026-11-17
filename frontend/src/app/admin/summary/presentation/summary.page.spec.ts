import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

  it('shows only figures the endpoint returned', async () => {
    const page = await open();
    const text = page.textContent ?? '';

    expect(page.querySelectorAll('.kpis app-kpi-tile .value')[0].textContent).toContain('12');
    expect(text).toContain('Rutas con nivel Bajo');
    expect(text).toContain('Nivel Alto');
    expect(text).not.toMatch(/\bsegura\b|\binsegura\b/i);
  });

  it('marks the metrics that do not exist yet as "Próximamente", with no number', async () => {
    const page = await open();
    const soon = Array.from(page.querySelectorAll('.soon app-kpi-tile'));

    expect(soon.map((tile) => tile.querySelector('.label')?.textContent)).toEqual([
      'Entrenamientos registrados',
      'Alertas SOS',
      'Eventos',
    ]);
    expect(soon.every((tile) => tile.querySelector('.value') === null)).toBe(true);
  });

  it('does not draw the blocks the caller may not see', async () => {
    get.mockResolvedValue(summaryFixture({ users: null, cities: null }));

    const page = await open();

    expect(page.textContent).not.toContain('Altas por semana');
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
      providers: [provideRouter([]), SummaryStore, { provide: SummaryRepository, useValue: { get } }],
    });
    const fixture = TestBed.createComponent(SummaryPage);
    fixture.componentInstance.ionViewWillEnter();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.skeleton[aria-busy="true"]')).not.toBeNull();
  });
});
