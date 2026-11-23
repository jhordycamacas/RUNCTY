import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LatestUser } from '../domain/summary';
import { LatestUsers } from './latest-users';

const NOW = new Date(2026, 10, 23, 15, 0);
const at = (month: number, day: number): string => new Date(2026, month, day, 12).toISOString();

@Component({
  imports: [LatestUsers],
  template: `<app-latest-users [users]="users" [cityNames]="cities" [now]="now" />`,
})
class Host {
  now = NOW;
  cities = new Map([['loja', 'Loja']]);
  users: LatestUser[] = [
    { uid: 'u1', firstName: 'Ana', lastName: 'Mora', cityId: 'loja', createdAt: at(10, 21) },
    { uid: 'u2', firstName: 'Luis', lastName: '', cityId: 'gone', createdAt: at(10, 10) },
    { uid: 'u3', firstName: '', lastName: '', cityId: null, createdAt: at(10, 23) },
  ];
}

describe('LatestUsers', () => {
  let root: HTMLElement;

  async function open(users?: LatestUser[]): Promise<void> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Host);
    if (users) fixture.componentInstance.users = users;
    fixture.detectChanges();
    await fixture.whenStable();
    root = fixture.nativeElement;
  }

  const rows = (): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>('li'));

  it('titles the panel and explains it in one line', async () => {
    await open();

    expect(root.querySelector('h2')?.textContent?.trim()).toBe('Últimos usuarios registrados');
    expect(root.querySelector('.note')?.textContent).toContain('cuentas');
  });

  it('shows the initials avatar, the full name, the city and how long ago, one row per account', async () => {
    await open();

    const [ana] = rows();
    expect(ana.querySelector('.name')?.textContent?.trim()).toBe('Ana Mora');
    expect(ana.querySelector('.city')?.textContent?.trim()).toBe('Loja');
    expect(ana.querySelector('.when')?.textContent?.trim()).toBe('hace 2 días');
    expect(ana.querySelector('app-avatar .initials')?.textContent?.trim()).toBe('AM');
    expect(rows()).toHaveLength(3);
  });

  it('links each account to its detail page', async () => {
    await open();

    expect(rows().map((row) => row.querySelector('a')?.getAttribute('href'))).toEqual([
      '/admin/usuarios/u1',
      '/admin/usuarios/u2',
      '/admin/usuarios/u3',
    ]);
  });

  it('writes the short date after a week and leaves out a city it does not know', async () => {
    await open();

    const [, luis, nameless] = rows();
    expect(luis.querySelector('.when')?.textContent?.trim()).toBe('10 nov');
    expect(luis.querySelector('.city')).toBeNull();
    expect(nameless.querySelector('.name')?.textContent?.trim()).toBe('Sin nombre');
    expect(nameless.querySelector('.when')?.textContent?.trim()).toBe('hoy');
  });

  it('never shows an email or an id number', async () => {
    await open();

    expect(root.textContent).not.toMatch(/@|\d{10}/);
  });

  it('says so when there are no accounts', async () => {
    await open([]);

    expect(rows()).toHaveLength(0);
    expect(root.textContent).toContain('Todavía no hay usuarios registrados');
  });
});
