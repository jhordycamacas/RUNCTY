import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon, IonRippleEffect } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, helpCircleOutline } from 'ionicons/icons';
import { PreferencesStore } from '../../preferences/application/preferences.store';
import { distanceParts } from '../../preferences/domain/units';
import { routeSafetyForSlot } from '../domain/catalog';
import {
  SEVERITY_LABELS,
  formatElevation,
} from '../domain/labels';
import { Route } from '../domain/route';
import { RoutePreview } from './route-preview';
import { SafetyBadge } from './safety-badge';

addIcons({ chevronForward, helpCircleOutline });

/**
 * Catalog card: a dark rounded card with the distance in big condensed numerals, the route
 * summary, its safety level for the selected time slot and the main risk factor that explains it.
 * A small picture sits beside the name: the image a manager uploaded for the route, or else its
 * shape colored by that level. It links to the
 * detail, carrying the slot along, and gives press feedback (ripple and a slight scale). A
 * `featured` card (recommended on the home) is larger.
 */
@Component({
  selector: 'app-route-card',
  imports: [RouterLink, IonIcon, IonRippleEffect, RoutePreview, SafetyBadge],
  host: { '[class.featured]': 'featured()' },
  template: `
    <a
      class="card ion-activatable"
      [routerLink]="['/app/rutas', route().id]"
      [queryParams]="{ franja: slotKey() }"
      [style.animation-delay.ms]="entranceDelay()"
    >
      <span class="top">
        @if (route().imageThumb; as thumb) {
          <img class="preview photo" [src]="thumb" [alt]="'Imagen de ' + route().name" loading="lazy" />
        } @else {
          <app-route-preview class="preview" [points]="route().preview" [level]="safety()?.level ?? null" />
        }
        <span class="summary">
          <span class="header">
            <strong class="name">{{ route().name }}</strong>
            <ion-icon name="chevron-forward" aria-hidden="true" />
          </span>
          <span class="figures">
            <span class="figure">{{ distance().value }}<small>{{ distance().unit }}</small></span>
            <span class="meta">{{ meta() }}</span>
          </span>
        </span>
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
      <ion-ripple-effect />
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
      animation: card-in 360ms ease-out both;
      transition: transform 120ms ease-out;
    }

    .card:active {
      transform: scale(0.985);
    }

    @keyframes card-in {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .card {
        animation: none;
        transition: none;
      }

      .card:active {
        transform: none;
      }
    }

    .card:focus-visible {
      outline: 3px solid var(--rc-primary-text);
      outline-offset: 2px;
    }

    .top {
      display: flex;
      align-items: center;
      gap: var(--rc-space-md);
    }

    .preview {
      flex: none;
      width: 5.5rem;
    }

    // The image a manager uploaded takes the place of the generated shape, in the same box.
    .photo {
      aspect-ratio: 1;
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-sm);
      object-fit: cover;
    }

    .summary {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: var(--rc-space-xs);
      min-width: 0;
    }

    .header {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    .header ion-icon {
      color: var(--rc-text-muted);
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

    :host(.featured) .preview {
      width: 6.5rem;
    }

    :host(.featured) .name {
      font-size: var(--rc-font-size-title);
    }

    :host(.featured) .figure {
      font-size: 3rem;
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
  /** Position in the list: later cards enter a little later (see `entranceDelay`). */
  readonly index = input(0);

  private readonly preferences = inject(PreferencesStore);

  protected readonly safety = computed(() => routeSafetyForSlot(this.route(), this.slotKey()));

  /** Staggered entrance: 60 ms per position, up to the 6th, so long lists do not wait. */
  protected readonly entranceDelay = computed(() => Math.min(this.index(), 6) * 60);

  protected readonly distance = computed(() =>
    distanceParts(this.route().distanceKm, this.preferences.preferences().units),
  );

  /** "15 m de desnivel · Principiante · Asfalto". */
  protected readonly meta = computed(() => {
    const { elevationGainM, difficulty, surface } = this.route();
    const units = this.preferences.preferences().units;
    return [
      `${formatElevation(elevationGainM, units)} de desnivel`,
      difficulty,
      surface,
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
      text: `${factor.type}${where}`,
      severity: SEVERITY_LABELS[factor.severity].toLowerCase(),
    };
  });
}
