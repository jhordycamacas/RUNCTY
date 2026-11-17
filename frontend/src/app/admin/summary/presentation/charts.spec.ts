import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BarList } from './bar-list';
import { KpiTile } from './kpi-tile';
import { ProgressBar } from './progress-bar';
import { StackedBar } from './stacked-bar';
import { WeeklyBars, weekLabel } from './weekly-bars';

@Component({
  imports: [BarList, KpiTile, ProgressBar, StackedBar, WeeklyBars],
  template: `
    <app-kpi-tile label="Usuarios" icon="people-outline" [value]="12" hint="6 con perfil" />
    <app-kpi-tile label="Eventos" icon="calendar-outline" [soon]="true" />
    <app-bar-list label="Rutas por dificultad" [items]="bars" />
    <app-stacked-bar subject="Rutas por nivel" [segments]="segments" />
    <app-weekly-bars [weeks]="weeks" />
    <app-progress-bar label="Perfiles" [percent]="150" detail="3 de 4" />
  `,
})
class Host {
  bars = [
    { label: 'Principiante', value: 4 },
    { label: 'Avanzado', value: 0 },
  ];
  segments = [
    { label: 'Nivel Alto', value: 3, tone: 'success' as const },
    { label: 'Nivel Bajo', value: 1, tone: 'danger' as const },
  ];
  weeks = [
    { weekStart: '2026-11-09', count: 2 },
    { weekStart: '2026-11-16', count: 4 },
  ];
}

describe('summary charts', () => {
  let root: HTMLElement;

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

  it('lists every bar with its label and its number, scaled to the largest', () => {
    const rows = Array.from(root.querySelectorAll('app-bar-list li'));

    expect(
      rows.map((row) => [
        row.querySelector('.name')?.textContent,
        row.querySelector('.value')?.textContent,
      ]),
    ).toEqual([
      ['Principiante', '4'],
      ['Avanzado', '0'],
    ]);
    const fills = root.querySelectorAll<HTMLElement>('app-bar-list .fill');
    expect(fills[0].style.width).toBe('100%');
    expect(fills[1].style.width).toBe('0%');
  });

  it('describes the stacked bar in text and gives the share of each part', () => {
    expect(root.querySelector('app-stacked-bar [role="img"]')?.getAttribute('aria-label')).toBe(
      'Rutas por nivel: Nivel Alto 3, Nivel Bajo 1',
    );
    expect(root.querySelector('app-stacked-bar .legend')?.textContent).toContain('75%');
  });

  it('repeats the weekly columns in a table for screen readers', () => {
    const cells = Array.from(root.querySelectorAll('app-weekly-bars tbody td')).map(
      (cell) => cell.textContent,
    );

    expect(cells).toEqual(['9 nov', '2', '16 nov', '4']);
    expect(root.querySelector('app-weekly-bars .current .number')?.textContent).toBe('4');
  });

  it('keeps a progress bar between 0 and 100', () => {
    const bar = root.querySelector('app-progress-bar [role="progressbar"]');

    expect(bar?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('writes a week as day and short month', () => {
    expect(weekLabel('2026-09-28')).toBe('28 sept');
  });
});
