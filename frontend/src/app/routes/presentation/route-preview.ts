import { Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { mapOutline } from 'ionicons/icons';
import { PreviewPoint, previewPath, projectPreview } from '../domain/route-preview';
import { LatLng, SafetyLevel } from '../domain/route';

addIcons({ mapOutline });

const SIZE = 100;
const PADDING = 14;

/**
 * Picture of the shape of a route, drawn as an inline SVG from its down-sampled points: no map
 * tiles, keys or network. The line takes the color of the safety level for the selected time slot,
 * with a dot at the start and a ring at the end. It is decorative (`aria-hidden`): the text of the
 * card carries the meaning. Without a usable shape it shows a map icon instead.
 */
@Component({
  selector: 'app-route-preview',
  imports: [IonIcon],
  template: `
    @if (shape(); as drawn) {
      <svg
        viewBox="0 0 100 100"
        [class]="'tone-' + (level() ?? 'none')"
        aria-hidden="true"
        focusable="false"
      >
        <path class="grid" d="M0 25H100M0 50H100M0 75H100M25 0V100M50 0V100M75 0V100" />
        <path class="glow" [attr.d]="drawn.path" />
        <path class="line" [attr.d]="drawn.path" />
        <circle class="start" [attr.cx]="drawn.start.x" [attr.cy]="drawn.start.y" r="4" />
        <circle class="end" [attr.cx]="drawn.end.x" [attr.cy]="drawn.end.y" r="4.5" />
      </svg>
    } @else {
      <ion-icon name="map-outline" aria-hidden="true" />
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1;
      overflow: hidden;
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-sm);
      background: linear-gradient(150deg, var(--rc-surface), var(--rc-primary-tint));
      color: var(--rc-text-muted);
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    ion-icon {
      font-size: 2rem;
    }

    .tone-high {
      --line: var(--rc-success);
    }

    .tone-medium {
      --line: var(--rc-warning);
    }

    .tone-low {
      --line: var(--rc-danger);
    }

    .tone-none {
      --line: var(--rc-primary);
    }

    .grid {
      fill: none;
      stroke: var(--rc-border);
      stroke-width: 0.6;
      opacity: 0.7;
    }

    .line,
    .glow {
      fill: none;
      stroke: var(--line);
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .line {
      stroke-width: 3.5;
    }

    .glow {
      stroke-width: 8;
      opacity: 0.22;
    }

    .start {
      fill: var(--line);
      stroke: var(--rc-surface-elevated);
      stroke-width: 1.5;
    }

    .end {
      fill: var(--rc-surface-elevated);
      stroke: var(--line);
      stroke-width: 2.5;
    }
  `,
})
export class RoutePreview {
  /** The route shape in order, as the list sends it. */
  readonly points = input.required<readonly LatLng[]>();
  /** Safety level for the selected slot; null draws the line in the brand color. */
  readonly level = input<SafetyLevel | null>(null);

  protected readonly shape = computed(() => {
    const points = this.points();
    if (points.length < 2) return null;
    const projected: PreviewPoint[] = projectPreview(points, {
      width: SIZE,
      height: SIZE,
      padding: PADDING,
    });
    return {
      path: previewPath(projected),
      start: projected[0],
      end: projected[projected.length - 1],
    };
  });
}
