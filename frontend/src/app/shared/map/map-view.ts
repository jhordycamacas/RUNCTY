import {
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MAP_RENDERER, MapLine, MapMarker, MapPoint, MapScene, MountedMap } from './map-renderer';

/**
 * An interactive map that draws `lines` and `markers` (the map port, `map-renderer.ts`). The map
 * provider (Google Maps or the Leaflet fallback) loads on demand the first time the component renders. Not encapsulated: the provider
 * draws its own DOM, and the classes below give its lines and markers the theme colors.
 */
@Component({
  selector: 'app-map-view',
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'region',
    '[attr.aria-label]': 'label()',
    '[class.rc-map-interactive]': 'interactive()',
  },
  template: `
    <div #canvas class="rc-map-canvas"></div>
    @if (failed()) {
      <p class="rc-map-failed">No pudimos cargar el mapa. Revisa tu conexión.</p>
    }
    @if (notice(); as text) {
      <p class="rc-map-notice" role="status">{{ text }}</p>
    }
  `,
  styles: `
    app-map-view {
      position: relative;
      display: block;
      overflow: hidden;
      height: 15rem;
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface);
    }

    app-map-view .rc-map-canvas {
      width: 100%;
      height: 100%;
    }

    app-map-view .rc-map-failed {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      margin: 0;
      padding: var(--rc-space-lg);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
      text-align: center;
    }

    // Says which map stands in for Google; over the map panes (Leaflet's go up to 1000).
    app-map-view .rc-map-notice {
      position: absolute;
      inset: auto 0 0 0;
      z-index: 1001;
      margin: 0;
      padding: var(--rc-space-xs) var(--rc-space-sm);
      background: var(--rc-surface);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    // A map to aim on: the crosshair says a click marks a point.
    app-map-view.rc-map-interactive .leaflet-container {
      cursor: crosshair;
    }

    // Zoom buttons with the 48px touch target.
    app-map-view .leaflet-bar a {
      width: 48px;
      height: 48px;
      line-height: 48px;
    }

    app-map-view .rc-map-line--route {
      stroke: var(--rc-primary);
    }

    app-map-view .rc-map-line--safe {
      stroke: var(--rc-success);
    }

    app-map-view .rc-map-line--caution {
      stroke: var(--rc-warning);
    }

    app-map-view .rc-map-line--danger {
      stroke: var(--rc-danger);
    }

    app-map-view .rc-map-marker {
      stroke: var(--rc-page);
    }

    app-map-view .rc-map-marker--start,
    app-map-view .rc-map-marker--position {
      fill: var(--rc-primary);
    }

    app-map-view .rc-map-marker--end {
      fill: var(--rc-text);
    }
  `,
})
export class MapView {
  /** What the map shows, for screen readers (e.g. «Mapa de la ruta»). */
  readonly label = input.required<string>();
  readonly lines = input<readonly MapLine[]>([]);
  readonly markers = input<readonly MapMarker[]>([]);
  /** Keep the `position` marker centred. */
  readonly follow = input(false);
  /** Where to look while there is nothing to frame (see `MapScene.view`). */
  readonly view = input<MapScene['view']>();
  /** Report the clicks on the map through `mapClick`, and show a pointer to aim with. */
  readonly interactive = input(false);
  readonly mapClick = output<MapPoint>();

  private readonly loadRenderer = inject(MAP_RENDERER);
  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private readonly mounted = signal<MountedMap | null>(null);
  protected readonly failed = signal(false);
  protected readonly notice = signal<string | null>(null);

  constructor() {
    let destroyed = false;
    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      this.mounted()?.destroy();
    });

    afterNextRender(() => {
      this.loadRenderer().then(
        (renderer) => {
          if (!destroyed)
            this.mounted.set(
              renderer.mount(this.canvas().nativeElement, {
                notice: (text) => this.notice.set(text),
                click: (point) => {
                  if (this.interactive()) this.mapClick.emit(point);
                },
              }),
            );
        },
        () => this.failed.set(true),
      );
    });

    effect(() => {
      this.mounted()?.show({
        lines: this.lines(),
        markers: this.markers(),
        follow: this.follow(),
        view: this.view(),
      });
    });
  }
}
