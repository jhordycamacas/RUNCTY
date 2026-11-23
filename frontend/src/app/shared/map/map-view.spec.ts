import { TestBed } from '@angular/core/testing';
import { MAP_RENDERER, MapLine, MapRenderer } from './map-renderer';
import { MapView } from './map-view';
import { FakeMapRenderer, provideFakeMapRenderer } from './testing/fake-map-renderer';

describe('MapView', () => {
  const line: MapLine = {
    tone: 'route',
    points: [
      { lat: -2.9, lng: -79.0 },
      { lat: -2.91, lng: -79.01 },
    ],
  };

  async function render(renderer = new FakeMapRenderer()) {
    TestBed.configureTestingModule({ providers: [provideFakeMapRenderer(renderer)] });
    const fixture = TestBed.createComponent(MapView);
    fixture.componentRef.setInput('label', 'Mapa de la ruta');
    fixture.componentRef.setInput('lines', [line]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, renderer };
  }

  it('mounts the map and shows the lines and markers', async () => {
    const { fixture, renderer } = await render();

    expect(renderer.mounts).toBe(1);
    expect(renderer.scene).toEqual({ lines: [line], markers: [], follow: false });
    expect((fixture.nativeElement as HTMLElement).getAttribute('aria-label')).toBe(
      'Mapa de la ruta',
    );
  });

  it('redraws when the inputs change and follows the position on demand', async () => {
    const { fixture, renderer } = await render();

    fixture.componentRef.setInput('markers', [{ kind: 'position', at: line.points[1] }]);
    fixture.componentRef.setInput('follow', true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(renderer.scene).toEqual({
      lines: [line],
      markers: [{ kind: 'position', at: line.points[1] }],
      follow: true,
    });
  });

  it('reports the clicks on the map only when it is interactive', async () => {
    const { fixture, renderer } = await render();
    const clicks: unknown[] = [];
    fixture.componentInstance.mapClick.subscribe((point) => clicks.push(point));

    renderer.click({ lat: -3.9, lng: -79.2 });
    expect(clicks).toEqual([]);

    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();
    renderer.click({ lat: -3.9, lng: -79.2 });
    expect(clicks).toEqual([{ lat: -3.9, lng: -79.2 }]);
    expect((fixture.nativeElement as HTMLElement).classList).toContain('rc-map-interactive');
  });

  it('passes the initial view to the map', async () => {
    const { fixture, renderer } = await render();
    const view = { center: { lat: -3.99, lng: -79.2 }, zoom: 13 };

    fixture.componentRef.setInput('view', view);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(renderer.scene?.view).toEqual(view);
  });

  it('removes the map with the component', async () => {
    const { fixture, renderer } = await render();

    fixture.destroy();

    expect(renderer.destroyed).toBe(1);
  });

  it('says so when the map cannot load', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: MAP_RENDERER, useValue: () => Promise.reject(new Error('offline')) }],
    });
    const fixture = TestBed.createComponent(MapView);
    fixture.componentRef.setInput('label', 'Mapa');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No pudimos cargar el mapa',
    );
  });

  it('shows the notice a renderer gives, and clears it', async () => {
    let hooks: { notice(text: string | null): void } | undefined;
    const renderer: MapRenderer = {
      mount: (_host, given) => {
        hooks = given;
        return { show: () => undefined, destroy: () => undefined };
      },
    };
    const { fixture } = await render(renderer as unknown as FakeMapRenderer);
    const element = fixture.nativeElement as HTMLElement;

    hooks?.notice('Mostramos el mapa de OpenStreetMap.');
    fixture.detectChanges();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('OpenStreetMap');

    hooks?.notice(null);
    fixture.detectChanges();
    expect(element.querySelector('[role="status"]')).toBeNull();
  });
});
