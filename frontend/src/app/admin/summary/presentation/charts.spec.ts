import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { weekLabel } from '../domain/labels';
import { BarChart } from './bar-chart';
import { BarList } from './bar-list';
import { DonutChart } from './donut-chart';
import { KpiTile } from './kpi-tile';
import { ProgressBar } from './progress-bar';

@Component({
  imports: [BarChart, BarList, DonutChart, KpiTile, ProgressBar],
  template: `
    <app-kpi-tile label="Usuarios" icon="people-outline" [value]="12" hint="6 con perfil" />
    <app-kpi-tile label="Eventos" icon="calendar-outline" [soon]="true" />
    <app-bar-list label="Apariencia" [items]="list" />
    <app-donut-chart id="donut" subject="Rutas por dificultad" [slices]="slices" />
    <app-donut-chart id="empty" subject="Rutas por superficie" [slices]="empty" />
    <app-donut-chart id="single" subject="Usuarios por rol" [slices]="single" />
    <app-bar-chart id="bars" subject="Altas por semana" [bars]="bars" [highlightLast]="true" />
    <app-bar-chart id="none" subject="Rutas por ciudad" [bars]="[]" />
    <app-progress-bar label="Perfiles" [percent]="150" detail="3 de 4" />
  `,
})
class Host {
  list = [
    { label: 'Claro', value: 4 },
    { label: 'Oscuro', value: 0 },
  ];
  slices = [
    { label: 'Principiante', value: 1, color: 'fuchsia' as const },
    { label: 'Intermedio', value: 1, color: 'ink' as const },
    { label: 'Avanzado', value: 1, color: 'silver' as const },
  ];
  empty = [{ label: 'Asfalto', value: 0, color: 'fuchsia' as const }];
  single = [{ label: 'Corredores', value: 7, color: 'fuchsia' as const }];
  bars = [
    { label: '9 nov', value: 2 },
    { label: 'Un nombre de ruta muy largo', value: 4 },
  ];
}

describe('summary charts', () => {
  let root: HTMLElement;
  const find = (selector: string) => root.querySelector(selector) as HTMLElement;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    root = fixture.nativeElement;
  });

  it('shows the figure of a tile, and "Próximamente" without any number for a future metric', () => {
    const [users, events] = Array.from(root.querySelectorAll('app-kpi-tile'));

    expect(users.textContent).toContain('12');
    expect(users.textContent).toContain('6 con perfil');
    expect(events.textContent).toContain('Próximamente');
    expect(events.querySelector('.value')).toBeNull();
  });

  it('lists every bar of a list with its number', () => {
    const rows = Array.from(root.querySelectorAll('app-bar-list li'));

    expect(rows.map((row) => row.querySelector('.value')?.textContent)).toEqual(['4', '0']);
  });

  describe('donut', () => {
    it('draws one arc per slice, shares adding up to 100 and the total in the center', () => {
      const donut = find('#donut');

      expect(donut.querySelectorAll('circle.arc')).toHaveLength(3);
      const shares = Array.from(donut.querySelectorAll('.legend .share')).map((el) =>
        Number(el.textContent?.replace('%', '')),
      );
      expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
      expect(donut.querySelector('.center strong')?.textContent).toBe('3');
    });

    it('is described in text and repeated in a table for screen readers', () => {
      const donut = find('#donut');

      expect(donut.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
        'Rutas por dificultad: Principiante 1, Intermedio 1, Avanzado 1',
      );
      expect(donut.querySelectorAll('table.sr-only tbody tr')).toHaveLength(3);
    });

    it('shows a neutral ring and "Sin datos" when the total is zero', () => {
      const donut = find('#empty');

      expect(donut.querySelectorAll('circle.arc')).toHaveLength(0);
      expect(donut.querySelector('.center')?.textContent).toContain('Sin datos');
    });

    it('fills the whole ring with a single slice', () => {
      const arc = find('#single').querySelector('circle.arc') as SVGElement;

      expect(arc.getAttribute('stroke-dasharray')).toBe('100 0');
      expect(find('#single').querySelector('.legend .share')?.textContent).toBe('100%');
    });
  });

  describe('bar chart', () => {
    it('shows the value over each bar, scaled to a round axis maximum', () => {
      const chart = find('#bars');
      const values = Array.from(chart.querySelectorAll('.bar-col .value')).map(
        (el) => el.textContent,
      );
      const heights = Array.from(chart.querySelectorAll<HTMLElement>('.bar')).map(
        (el) => el.style.height,
      );

      expect(values).toEqual(['2', '4']);
      expect(heights).toEqual(['40%', '80%']);
      expect(chart.querySelector('.tick.top')?.textContent).toBe('5');
    });

    it('marks the current bar and keeps the full name of a long one in a title', () => {
      const chart = find('#bars');

      expect(chart.querySelectorAll('.bar-col.current')).toHaveLength(1);
      const names = Array.from(chart.querySelectorAll('.category'));
      expect(names[1].getAttribute('title')).toBe('Un nombre de ruta muy largo');
    });

    it('describes itself and repeats its data in a table', () => {
      const chart = find('#bars');

      expect(chart.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
        'Altas por semana: 9 nov 2, Un nombre de ruta muy largo 4',
      );
      expect(chart.querySelectorAll('table.sr-only tbody tr')).toHaveLength(2);
    });

    it('says there is no data instead of drawing an empty plot', () => {
      expect(find('#none').textContent).toContain('Sin datos todavía');
    });
  });

  it('keeps a progress bar between 0 and 100', () => {
    expect(
      root.querySelector('app-progress-bar [role="progressbar"]')?.getAttribute('aria-valuenow'),
    ).toBe('100');
  });

  it('writes a week as day and short month', () => {
    expect(weekLabel('2026-09-28')).toBe('28 sept');
  });
});
