import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferencesStore } from '../../preferences/application/preferences.store';
import { defaultPreferences } from '../../preferences/domain/preferences';
import { PositionSource } from '../domain/position-source';
import { FakePositionSource } from '../testing/fake-position-source';
import { RunPage } from './run.page';

describe('RunPage', () => {
  let fixture: ComponentFixture<RunPage>;
  let gps: FakePositionSource;

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
    TestBed.configureTestingModule({
      providers: [
        { provide: PositionSource, useValue: gps },
        { provide: PreferencesStore, useValue: { preferences: signal(defaultPreferences()) } },
      ],
    });
    fixture = TestBed.createComponent(RunPage);
    fixture.detectChanges();
  });

  it('says where the map will go and shows zeroed figures before starting', () => {
    expect(text()).toContain('El mapa se activará cuando se configure Google Maps.');
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

  it('explains how to allow the location when it is refused', async () => {
    gps.permission = 'denied';

    await press('Empezar');

    expect(root().querySelector('[role="alert"]')?.textContent).toContain(
      'Necesitamos tu ubicación',
    );
    expect(button('Empezar')).toBeDefined();
  });
});
