import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, helpCircleOutline } from 'ionicons/icons';
import { PreferencesStore } from '../../preferences/application/preferences.store';
import { formatDistance } from '../../preferences/domain/units';
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
 * Catalog card: the route summary with its safety level for the selected time slot and the main
 * risk factor that explains it. It links to the detail, carrying the slot along.
 */
@Component({
  selector: 'app-route-card',
  imports: [RouterLink, IonIcon, SafetyBadge],
  template: `
    <a class="card" [routerLink]="['/app/rutas', route().id]" [queryParams]="{ franja: slotKey() }">
      <span class="header">
        <strong class="name">{{ route().name }}</strong>
        <ion-icon name="chevron-forward" aria-hidden="true" />
      </span>
      <span class="meta">{{ meta() }}</span>
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
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-sm);
      min-height: var(--rc-min-touch-target);
      padding: var(--rc-space-lg);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      box-shadow: var(--rc-shadow-sm);
      background: var(--rc-surface-elevated);
      color: var(--rc-text);
      text-decoration: none;
    }

    .header {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    .name {
      flex: 1;
      font-size: var(--rc-font-size-subtitle);
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
      border-radius: var(--rc-radius-sm);
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

  private readonly preferences = inject(PreferencesStore);

  protected readonly safety = computed(() => routeSafetyForSlot(this.route(), this.slotKey()));

  /** "3,2 km · 15 m de desnivel · Principiante · Asfalto". */
  protected readonly meta = computed(() => {
    const { distanceKm, elevationGainM, difficulty, surface } = this.route();
    const units = this.preferences.preferences().units;
    return [
      formatDistance(distanceKm, units),
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
