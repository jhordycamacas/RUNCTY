import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PreferencesStore } from '../../preferences/application/preferences.store';
import { defaultPreferences } from '../../preferences/domain/preferences';
import { Route } from '../domain/route';
import { catalogRoutes } from './testing/fake-backend';
import { RouteCard } from './route-card';

describe('RouteCard', () => {
  let fixture: ComponentFixture<RouteCard>;
  let units: ReturnType<typeof signal<ReturnType<typeof defaultPreferences>>>;
  const [jipiro, , unrated] = catalogRoutes();

  const text = () => (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ') ?? '';
  function render(route: Route, slotKey: string | null): void {
    fixture = TestBed.createComponent(RouteCard);
    fixture.componentRef.setInput('route', route);
    fixture.componentRef.setInput('slotKey', slotKey);
    fixture.detectChanges();
  }

  beforeEach(() => {
    units = signal(defaultPreferences());
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PreferencesStore, useValue: { preferences: units } },
      ],
    });
  });

  it('summarizes the route with the units preference', () => {
    render(jipiro, '05:00-07:00');
    expect(text()).toContain('3,2 km · 15 m de desnivel · Principiante · Asfalto');

    units.set({ ...defaultPreferences(), units: 'imperial' });
    fixture.detectChanges();
    expect(text()).toContain('2 mi · 49 ft de desnivel');
  });

  it('shows the level as Alto, Medio or Bajo, never as safe or unsafe', () => {
    render(jipiro, '05:00-07:00');
    expect(text()).toContain('Seguridad: Alto');

    render(jipiro, '18:00-20:00');
    expect(text()).toContain('Seguridad: Bajo');
    expect(text().toLowerCase()).not.toMatch(/insegur|\bsegura\b/);
  });

  it('prefixes the main factor with its severity', () => {
    render(jipiro, '18:00-20:00');

    expect(text()).toContain('Factor principal: Iluminación deficiente en Orilla del río');
    expect(text()).toContain('Severidad alta');
  });

  it('says when a slot has no factors or no evaluation', () => {
    render(jipiro, '05:00-07:00');
    expect(text()).toContain('Sin factores de riesgo registrados');

    render(unrated, '05:00-07:00');
    expect(text()).toContain('Sin evaluar en esta franja');
    expect(text()).not.toContain('Factor principal');
  });

  it('is a link to the detail of the route with the slot', () => {
    render(jipiro, '18:00-20:00');

    const link = (fixture.nativeElement as HTMLElement).querySelector('a') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toContain('/app/rutas/jipiro');
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toContain('franja=18:00-20:00');
  });
});
