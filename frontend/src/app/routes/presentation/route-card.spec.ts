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
    expect(text()).toContain('3,2km15 m de desnivel · Principiante · Asfalto');

    units.set({ ...defaultPreferences(), units: 'imperial' });
    fixture.detectChanges();
    expect(text()).toContain('2mi49 ft de desnivel');
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

  it('draws the shape of the route colored by the level of the selected slot', () => {
    render(jipiro, '05:00-07:00');
    expect(fixture.nativeElement.querySelector('app-route-preview svg.tone-high')).not.toBeNull();

    render(jipiro, '18:00-20:00');
    expect(fixture.nativeElement.querySelector('app-route-preview svg.tone-low')).not.toBeNull();

    render(jipiro, null);
    expect(fixture.nativeElement.querySelector('app-route-preview svg.tone-none')).not.toBeNull();
  });

  it('shows a placeholder instead of the shape when the list sent no preview', () => {
    render(unrated, '05:00-07:00');

    expect(fixture.nativeElement.querySelector('app-route-preview svg')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-route-preview ion-icon')).not.toBeNull();
  });

  it('shows the image a manager uploaded instead of the generated shape', () => {
    const thumb = 'data:image/jpeg;base64,AAAA';
    render({ ...jipiro, imageThumb: thumb }, '05:00-07:00');

    const image = fixture.nativeElement.querySelector('a.card img') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe(thumb);
    expect(image.alt).toBe(`Imagen de ${jipiro.name}`);
    expect(fixture.nativeElement.querySelector('app-route-preview')).toBeNull();
  });

  it('falls back to the generated shape when the route has no image', () => {
    render({ ...jipiro, imageThumb: null }, '05:00-07:00');

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-route-preview svg')).not.toBeNull();
  });

  it('keeps the preview inside the link, so tapping it opens the detail', () => {
    render(jipiro, '05:00-07:00');

    const link = fixture.nativeElement.querySelector('a.card') as HTMLAnchorElement;
    expect(link.querySelector('app-route-preview')).not.toBeNull();
  });

  it('delays its entrance by its position in the list, with a ceiling', () => {
    render(jipiro, '05:00-07:00');
    const delay = () => (fixture.nativeElement.querySelector('a.card') as HTMLElement).style.animationDelay;
    expect(delay()).toBe('0ms');

    fixture.componentRef.setInput('index', 3);
    fixture.detectChanges();
    expect(delay()).toBe('180ms');

    fixture.componentRef.setInput('index', 40);
    fixture.detectChanges();
    expect(delay()).toBe('360ms');
  });
});
