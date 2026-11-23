import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Signups } from '../domain/summary';
import { AcquisitionChart } from './acquisition-chart';

@Component({
  imports: [AcquisitionChart],
  template: `<app-acquisition-chart [signups]="signups()" />`,
})
class Host {
  readonly signups = signal<Signups | null>(null);
}

/** Buckets from `2026-11-16` backwards (every 7 days), oldest first, with the given counts. */
function weeks(counts: number[]): { start: string; count: number }[] {
  return counts.map((count, index) => {
    const day = new Date(Date.UTC(2026, 10, 16) - (counts.length - 1 - index) * 7 * 86_400_000);
    return { start: day.toISOString().slice(0, 10), count };
  });
}

function days(total: number): { start: string; count: number }[] {
  return Array.from({ length: total }, (_, index) => {
    const day = new Date(Date.UTC(2026, 10, 17) - (total - 1 - index) * 86_400_000);
    return { start: day.toISOString().slice(0, 10), count: index === total - 1 ? 4 : 0 };
  });
}

function months(total: number): { start: string; count: number }[] {
  return Array.from({ length: total }, (_, index) => {
    const day = new Date(Date.UTC(2026, 10 - (total - 1 - index), 1));
    return { start: day.toISOString().slice(0, 10), count: 1 };
  });
}

function signupsFixture(changes: Partial<Signups> = {}): Signups {
  return {
    daily: days(30),
    weekly: weeks([2, 0, 3, 1, 0, 0, 5, 1, 0, 2, 4, 1]),
    monthly: months(12),
    before: { daily: 100, weekly: 40, monthly: 7 },
    ...changes,
  };
}

describe('AcquisitionChart', () => {
  let fixture: ComponentFixture<Host>;
  let root: HTMLElement;

  async function open(signups: Signups | null): Promise<void> {
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.signups.set(signups);
    fixture.detectChanges();
    await fixture.whenStable();
    root = fixture.nativeElement;
  }

  const all = <T extends Element>(selector: string): T[] =>
    Array.from(root.querySelectorAll<T>(selector));
  const text = (selector: string): string =>
    root.querySelector(selector)?.textContent?.trim() ?? '';
  const buttons = (): HTMLButtonElement[] => all<HTMLButtonElement>('.ranges button');
  const press = async (label: string): Promise<void> => {
    buttons()
      .find((button) => button.textContent?.trim() === label)
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const columns = (): SVGGElement[] => all<SVGGElement>('g.column');
  const focus = (index: number): void => {
    columns()[index].dispatchEvent(new Event('focus'));
    fixture.detectChanges();
  };

  it('draws the 12 weeks by default, with a title and a one-line explanation', async () => {
    await open(signupsFixture());

    expect(text('h2')).toBe('Adquisición de nuevos usuarios');
    expect(text('.note')).toContain('cuentas nuevas');
    expect(columns()).toHaveLength(12);
    expect(buttons().map((button) => button.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
    ]);
  });

  it('offers the three ranges as a group of toggle buttons', async () => {
    await open(signupsFixture());

    expect(root.querySelector('.ranges')?.getAttribute('role')).toBe('group');
    expect(buttons().map((button) => button.textContent?.trim())).toEqual([
      '30 días',
      '12 semanas',
      '12 meses',
    ]);
  });

  it('writes the new accounts of the range and the accumulated total, es-EC style', async () => {
    await open(signupsFixture({ before: { daily: 0, weekly: 1234, monthly: 0 } }));

    expect(text('.totals')).toBe('19 nuevos en el rango · 1.253 en total');
  });

  it('says "1 nuevo" in the singular', async () => {
    await open(
      signupsFixture({ weekly: weeks([0, 1]), before: { daily: 0, weekly: 0, monthly: 0 } }),
    );

    expect(text('.totals')).toBe('1 nuevo en el rango · 1 en total');
  });

  it('switches the range: 30 days, then 12 months, each with its own totals', async () => {
    await open(signupsFixture());

    await press('30 días');
    expect(columns()).toHaveLength(30);
    expect(text('.totals')).toBe('4 nuevos en el rango · 104 en total');
    expect(buttons()[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons()[1].getAttribute('aria-pressed')).toBe('false');

    await press('12 meses');
    expect(columns()).toHaveLength(12);
    expect(text('.totals')).toBe('12 nuevos en el rango · 19 en total');
  });

  it('shows the period, the new accounts and the accumulated total when a column is focused', async () => {
    await open(signupsFixture());

    focus(2);

    const tip = root.querySelector('.tooltip') as HTMLElement;
    expect(tip.textContent).toContain('Semana del 14 sept');
    expect(tip.textContent).toContain('3 nuevos');
    // 40 before the range + 2 + 0 + 3
    expect(tip.textContent).toContain('45 acumulados');
  });

  it('shows the tooltip on hover and on tap, and hides it when the pointer or focus leaves', async () => {
    await open(signupsFixture());

    columns()[11].dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(root.querySelector('.tooltip')?.textContent).toContain('1 nuevo');
    columns()[11].dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    expect(root.querySelector('.tooltip')).toBeNull();

    columns()[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(root.querySelector('.tooltip')?.textContent).toContain('0 nuevos');
    columns()[1].dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(root.querySelector('.tooltip')).toBeNull();
  });

  it('hides the tooltip with Escape and when the range changes', async () => {
    await open(signupsFixture());

    focus(3);
    root.querySelector('svg')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(root.querySelector('.tooltip')).toBeNull();

    focus(3);
    await press('12 meses');
    expect(root.querySelector('.tooltip')).toBeNull();
  });

  it('makes every column reachable by keyboard and described in words', async () => {
    await open(signupsFixture());

    const first = columns()[0];
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(first.getAttribute('aria-label')).toBe('Semana del 31 ago: 2 nuevos, 42 acumulados');
  });

  it('scales the bars to an axis with three whole-number ticks', async () => {
    await open(signupsFixture());

    expect(all('.tick').map((tick) => tick.textContent?.trim())).toEqual(['0', '3', '6']);
    expect(all('.bar')).toHaveLength(8); // weeks with no sign-ups draw no bar
  });

  it('thins the labels of the 30-day range but always names the current day', async () => {
    await open(signupsFixture());

    await press('30 días');

    const labels = all('.x-label').map((label) => label.textContent?.trim());
    expect(labels.length).toBeGreaterThan(3);
    expect(labels.length).toBeLessThan(15);
    expect(labels.at(-1)).toBe('17 nov');
  });

  it('describes itself and repeats its data in a table for assistive technology', async () => {
    await open(signupsFixture());

    expect(root.querySelector('svg')?.getAttribute('aria-label')).toBe(
      'Adquisición de nuevos usuarios, 12 semanas: 19 nuevos en el rango · 59 en total.',
    );
    const rows = all('.sr-only table tbody tr');
    expect(rows).toHaveLength(12);
    expect(rows[0].textContent).toContain('2 nuevos');
    expect(rows[11].textContent).toContain('59 acumulados');
  });

  it('draws with design tokens only, never a hardcoded color', async () => {
    await open(signupsFixture());

    expect(root.querySelector('svg')?.outerHTML).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  });

  it('shows a skeleton while the data is not there', async () => {
    await open(null);

    expect(root.querySelector('.skeleton[aria-busy="true"]')).not.toBeNull();
    expect(root.querySelector('svg')).toBeNull();
  });

  it('says there are no users yet instead of drawing an empty plot', async () => {
    await open(
      signupsFixture({
        daily: days(30).map((bucket) => ({ ...bucket, count: 0 })),
        weekly: weeks([0, 0]),
        monthly: months(12).map((bucket) => ({ ...bucket, count: 0 })),
        before: { daily: 0, weekly: 0, monthly: 0 },
      }),
    );

    expect(text('.empty')).toContain('Todavía no hay usuarios registrados');
    expect(root.querySelector('svg')).toBeNull();
    expect(buttons()).toHaveLength(3);
  });

  it('keeps a range with no new accounts readable when there are older users', async () => {
    await open(
      signupsFixture({ weekly: weeks([0, 0]), before: { daily: 0, weekly: 9, monthly: 0 } }),
    );

    expect(text('.totals')).toBe('0 nuevos en el rango · 9 en total');
    expect(all('.tick').map((tick) => tick.textContent?.trim())).toEqual(['0', '1', '2']);
    expect(all('.bar')).toHaveLength(0);
  });
});
