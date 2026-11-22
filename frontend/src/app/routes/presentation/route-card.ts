import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, helpCircleOutline } from 'ionicons/icons';
import { PreferencesStore } from '../../preferences/application/preferences.store';
import { distanceParts } from '../../preferences/domain/units';
import { routeSafetyForSlot } from '../domain/catalog';
import {
  DIFFICULTY_LABELS,
  SEVERITY_LABELS,
  SURFACE_LABELS,
  factorTypeLabel,
  formatElevation,
} from '../domain/labels';
import { Route } from '../domain/route';
import { SafetyBadge } from './safety-badge';

addIcons({ chevronForward, helpCircleOutline });

/**
 * Catalog card: a dark rounded card with the distance in big condensed numerals, the route
 * summary, its safety level for the selected time slot and the main risk factor that explains it.
 * It links to the detail, carrying the slot along. A `featured` card (recommended on the home) is
 * larger and draws a subtle neon route line.
 */
@Component({
  selector: 'app-route-card',
  imports: [RouterLink, IonIcon, SafetyBadge],
  host: { '[class.featured]': 'featured()' },
  template: `
    <a class="card" [routerLink]="['/app/rutas', route().id]" [queryParams]="{ franja: slotKey() }">
      @if (featured()) {
        <svg class="line" viewBox="0 0 120 60" aria-hidden="true" focusable="false">
          <path d="M4 52 C 24 52, 22 18, 44 20 S 70 46, 86 30 S 104 8, 116 10" />
        </svg>
      }
      <span class="header">
        <strong class="name">{{ route().name }}</strong>
        <ion-icon name="chevron-forward" aria-hidden="true" />
      </span>
      <span class="figures">
        <span class="figure">{{ distance().value }}<small>{{ distance().unit }}</small></span>
        <span class="meta">{{ meta() }}</span>
      </span>
      <span class="safety">
        @if (safety(); as slot) {
          <app-safety-badge [level]="slot.level" />
        } @else {
          <span class="unrated">
            <ion-icon name="help-circle-outline" aria-hidden="true" />
            Sin evaluar en esta franja
          </span>
        }
      </span>
      @if (mainFactor(); as factor) {
        <span class="factor">
          <span class="factor-text">Factor principal: {{ factor.text }}</span>
          <span class="severity">Severidad {{ factor.severity }}</span>
        </span>
      } @else if (safety()) {
        <span class="factor-text">Sin factores de riesgo registrados</span>
      }
    </a>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: var(--rc-space-md);
    }

    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-sm);
      min-height: var(--rc-min-touch-target);
      padding: var(--rc-space-lg);
      overflow: hidden;
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
      color: var(--rc-text);
      text-decoration: none;
    }

    .card:focus-visible {
      outline: 3px solid var(--rc-primary-text);
      outline-offset: 2px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    .header ion-icon {
      color: var(--rc-primary-text);
    }

    .name {
      flex: 1;
      font-size: var(--rc-font-size-subtitle);
      font-weight: 600;
    }

    .figures {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--rc-space-xs) var(--rc-space-md);
    }

    // Distance in big condensed numerals, the unit small beside it.
    .figure {
      font-family: var(--rc-font-family-display);
      font-size: 2.25rem;
      font-weight: 500;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    .figure small {
      margin-left: 2px;
      font-family: var(--rc-font-family);
      font-size: var(--rc-font-size-label);
      font-weight: 500;
      color: var(--rc-text-muted);
    }

    :host(.featured) .card {
      gap: var(--rc-space-md);
      padding: var(--rc-space-xl) var(--rc-space-lg);
    }

    :host(.featured) .name {
      padding-right: 4rem;
      font-size: var(--rc-font-size-title);
    }

    :host(.featured) .figure {
      font-size: 3rem;
      color: var(--rc-primary-text);
    }

    // A route line in neon, decorative, in the corner of the featured card.
    .line {
      position: absolute;
      top: var(--rc-space-md);
      right: var(--rc-space-md);
      width: 5.5rem;
      height: 2.75rem;
      opacity: 0.85;
    }

    .line path {
      fill: none;
      stroke: var(--rc-primary);
      stroke-width: 3;
      stroke-linecap: round;
      filter: drop-shadow(0 0 3px var(--rc-primary));
    }

    .meta,
    .factor-text,
    .unrated {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .unrated {
      display: inline-flex;
      align-items: center;
      gap: var(--rc-space-xs);
    }

    .safety {
      display: flex;
    }

    .factor {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    .severity {
      padding: 2px var(--rc-space-sm);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-pill);
      color: var(--rc-text);
      font-size: var(--rc-font-size-caption);
      font-weight: 600;
    }
  `,
})
export class RouteCard {
  readonly route = input.required<Route>();
  /** Time slot window ("05:00-07:00") whose safety level is shown. */
  readonly slotKey = input<string | null>(null);
  readonly featured = input(false);

  private readonly preferences = inject(PreferencesStore);

  protected readonly safety = computed(() => routeSafetyForSlot(this.route(), this.slotKey()));

  protected readonly distance = computed(() =>
    distanceParts(this.route().distanceKm, this.preferences.preferences().units),
  );

  /** "15 m de desnivel · Principiante · Asfalto". */
  protected readonly meta = computed(() => {
    const { elevationGainM, difficulty, surface } = this.route();
    const units = this.preferences.preferences().units;
    return [
      `${formatElevation(elevationGainM, units)} de desnivel`,
      difficulty ? DIFFICULTY_LABELS[difficulty] : null,
      surface ? SURFACE_LABELS[surface] : null,
    ]
      .filter(Boolean)
      .join(' · ');
  });

  /** The first registered factor of the slot: "Iluminación deficiente en Orilla del río". */
  protected readonly mainFactor = computed(() => {
    const factor = this.safety()?.factors[0];
    if (!factor) return null;
    const where = factor.segmentName ? ` en ${factor.segmentName}` : '';
    return {
      text: `${factorTypeLabel(factor.type)}${where}`,
      severity: SEVERITY_LABELS[factor.severity].toLowerCase(),
    };
  });
}
