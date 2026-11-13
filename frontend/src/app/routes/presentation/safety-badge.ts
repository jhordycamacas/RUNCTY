import { Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, shieldCheckmarkOutline, shieldHalfOutline } from 'ionicons/icons';
import { SAFETY_LEVEL_LABELS } from '../domain/labels';
import { SafetyLevel } from '../domain/route';

addIcons({ alertCircleOutline, shieldCheckmarkOutline, shieldHalfOutline });

const ICONS: Record<SafetyLevel, string> = {
  high: 'shield-checkmark-outline',
  medium: 'shield-half-outline',
  low: 'alert-circle-outline',
};

/**
 * Safety level of a route (or segment) for a time slot, as Alto, Medio or Bajo. Icon, text and
 * colour all carry the level, so colour is never the only cue.
 */
@Component({
  selector: 'app-safety-badge',
  imports: [IonIcon],
  template: `
    <span class="badge" [class]="level()">
      <ion-icon [name]="icon()" aria-hidden="true" />
      <span class="prefix">Seguridad: </span>{{ short() }}
    </span>
  `,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: var(--rc-space-xs);
      padding: var(--rc-space-xs) var(--rc-space-md);
      border-radius: 999px;
      color: var(--rc-text);
      font-size: var(--rc-font-size-label);
      font-weight: 600;
      white-space: nowrap;
    }

    .high {
      background: var(--rc-success-tint);
    }

    .high ion-icon {
      color: var(--rc-success);
    }

    .medium {
      background: var(--rc-warning-tint);
    }

    .medium ion-icon {
      color: var(--rc-warning);
    }

    .low {
      background: var(--rc-danger-tint);
    }

    .low ion-icon {
      color: var(--rc-danger);
    }

    :host(.compact) .prefix {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  `,
  host: { '[class.compact]': 'compact()' },
})
export class SafetyBadge {
  readonly level = input.required<SafetyLevel>();
  /** Only "Alto", "Medio" or "Bajo" is shown; the "Seguridad:" prefix stays for screen readers. */
  readonly compact = input(false);

  protected readonly icon = computed(() => ICONS[this.level()]);
  protected readonly short = computed(() => SAFETY_LEVEL_LABELS[this.level()].short);
}
