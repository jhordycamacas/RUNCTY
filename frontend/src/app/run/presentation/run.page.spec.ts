import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PreferencesStore } from '../../preferences/application/preferences.store';
import { defaultPreferences } from '../../preferences/domain/preferences';
import { FakeMapRenderer, provideFakeMapRenderer } from '../../shared/map/testing/fake-map-renderer';
import { PositionSource } from '../domain/position-source';
import { FakePositionSource } from '../testing/fake-position-source';
import { RunPage } from './run.page';

describe('RunPage', () => {
  let fixture: ComponentFixture<RunPage>;
  let gps: FakePositionSource;
  let map: FakeMapRenderer;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent?.replace(/\s+/g, ' ') ?? '';
  const button = (label: string) =>
    [...root().querySelectorAll('button')].find((el) => el.textContent?.includes(label));
  const press = async (label: string) => {
    button(label)?.click();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    gps = new FakePositionSource();
    map = new FakeMapRenderer();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideFakeMapRenderer(map),
        { provide: PositionSource, useValue: gps },
        { provide: PreferencesStore, useValue: { preferences: signal(defaultPreferences()) } },
      ],
    });
    fixture = TestBed.createComponent(RunPage);
    fixture.detectChanges();
  });

  it('shows the map and zeroed figures before starting', () => {
    expect(root().querySelector('app-map-view')?.getAttribute('aria-label')).toBe(
      'Mapa de tu recorrido',
    );
    expect(text()).toContain('00:00');
    expect(text()).toContain('0,00km');
    expect(text()).toContain('--:--min/km');
    expect(button('Empezar')).toBeDefined();
  });

  it('goes from start to pause, resume and finish, with round controls', async () => {
    await press('Empezar');
    expect(text()).toContain('Corriendo');
    expect(button('Pausar')).toBeDefined();

    await press('Pausar');
    expect(text()).toContain('En pausa');

    await press('Reanudar');
    await press('Terminar');
    expect(text()).toContain('Pronto podrás guardar tus entrenamientos');
    expect(text()).toContain('Ritmo medio');
  });

  it('follows the runner on the map and draws the ground covered', async () => {
    await press('Empezar');
    gps.emit({ lat: -2.9, lng: -79.0, accuracyM: 5, timestamp: 1_000 });
    gps.emit({ lat: -2.901, lng: -79.0, accuracyM: 5, timestamp: 30_000 });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(map.scene).toEqual({
      lines: [
        {
          tone: 'route',
          points: [
            { lat: -2.9, lng: -79.0 },
            { lat: -2.901, lng: -79.0 },
          ],
        },
      ],
      markers: [
        {
          kind: 'position',
          at: { lat: -2.901, lng: -79.0, accuracyM: 5, timestamp: 30_000 },
        },
      ],
      follow: true,
    });
  });

  it('explains how to allow the location when it is refused', async () => {
    gps.permission = 'denied';

    await press('Empezar');

    expect(root().querySelector('[role="alert"]')?.textContent).toContain(
      'Necesitamos tu ubicación',
    );
    expect(button('Empezar')).toBeDefined();
  });
});
