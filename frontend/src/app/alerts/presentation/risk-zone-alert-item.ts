import { Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { locationOutline, timeOutline, warningOutline } from 'ionicons/icons';
import { ALERT_SEVERITY_LABELS, alertSchedule } from '../domain/labels';
import { RiskZoneAlert } from '../domain/risk-zone-alert';

addIcons({ locationOutline, timeOutline, warningOutline });

/** One risk-zone alert: its kind, a severity chip, the place and when it applies. */
@Component({
  selector: 'app-risk-zone-alert-item',
  imports: [IonIcon],
  template: `
    <article class="alert" [class]="alert().severity">
      <header>
        <span class="icon" aria-hidden="true"><ion-icon name="warning-outline" /></span>
        <h3>{{ alert().type }}</h3>
        <span class="chip">{{ severity() }}</span>
      </header>
      @if (alert().description) {
        <p class="description">{{ alert().description }}</p>
      }
      <p class="meta">
        <ion-icon name="location-outline" aria-hidden="true" />
        Zona de {{ alert().radiusM }} m de radio
      </p>
      <p class="meta">
        <ion-icon name="time-outline" aria-hidden="true" />
        {{ schedule() }}
      </p>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .alert {
      --tone: var(--rc-warning);
      --tone-tint: var(--rc-warning-tint);
      display: grid;
      gap: var(--rc-space-sm);
      padding: var(--rc-space-lg);
      border-left: 4px solid var(--tone);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .alert.alta {
      --tone: var(--rc-danger);
      --tone-tint: var(--rc-danger-tint);
    }

    .alert.baja {
      --tone: var(--rc-success);
      --tone-tint: var(--rc-success-tint);
    }

    header {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    .icon {
      display: grid;
      flex: none;
      place-items: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: var(--rc-radius-pill);
      background: var(--tone-tint);
      color: var(--tone);
      font-size: 1.1rem;
    }

    h3 {
      flex: 1;
      min-width: 0;
      margin: 0;
      font-size: var(--rc-font-size-body);
      font-weight: 600;
    }

    // State color as text on its own tint (4.5:1 or more in both themes).
    .chip {
      flex: none;
      padding: 2px var(--rc-space-sm);
      border: 1px solid var(--tone);
      border-radius: var(--rc-radius-pill);
      background: var(--tone-tint);
      color: var(--tone);
      font-size: var(--rc-font-size-caption);
      font-weight: 700;
    }

    p {
      margin: 0;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: var(--rc-space-xs);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }
  `,
})
export class RiskZoneAlertItem {
  readonly alert = input.required<RiskZoneAlert>();

  protected readonly severity = computed(() => ALERT_SEVERITY_LABELS[this.alert().severity]);
  protected readonly schedule = computed(() => alertSchedule(this.alert()));
}
