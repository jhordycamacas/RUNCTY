import { Component, computed, inject } from '@angular/core';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, pause, play, refresh, stop } from 'ionicons/icons';
import { PreferencesStore } from '../../preferences/application/preferences.store';
import { distanceParts, paceParts } from '../../preferences/domain/units';
import { MapLine, MapMarker } from '../../shared/map/map-renderer';
import { MapView } from '../../shared/map/map-view';
import { Notice } from '../../shared/ui/notice';
import { TabHeader } from '../../shared/ui/tab-header';
import { RunStore } from '../application/run.store';
import { formatDuration } from '../domain/run-tracker';

addIcons({ chevronForward, pause, play, refresh, stop });

const STATUS_LABELS = {
  idle: 'Listo para correr',
  running: 'Corriendo',
  paused: 'En pausa',
  finished: 'Entrenamiento terminado',
} as const;

/**
 * «Correr» tab: live GPS tracking with the time, the distance and the pace in big condensed
 * numerals, round controls to pause, resume and finish, and a map that follows the runner and
 * draws the ground covered. Saving the training is EP-12 (Sprint 4), so nothing leaves the phone.
 */
@Component({
  selector: 'app-run-page',
  imports: [IonContent, IonIcon, IonSpinner, MapView, Notice, TabHeader],
  template: `
    <app-tab-header title="Correr" />
    <ion-content>
      <div class="page">
        <app-map-view
          class="map"
          label="Mapa de tu recorrido"
          [lines]="track()"
          [markers]="here()"
          [follow]="run.status() === 'running'"
        />

        <p class="status" role="status">
          <span class="dot" [class]="run.status()" aria-hidden="true"></span>
          {{ statusLabel() }}
        </p>

        <section class="metrics" aria-label="Tu entrenamiento">
          <div class="metric time">
            <span class="figure">{{ time() }}</span>
            <span class="label">Tiempo</span>
          </div>
          <div class="metric">
            <span class="figure">{{ distance().value }}<small>{{ distance().unit }}</small></span>
            <span class="label">Distancia</span>
          </div>
          <div class="metric">
            <span class="figure">{{ pace().value }}<small>{{ pace().unit }}</small></span>
            <span class="label">{{ run.status() === 'finished' ? 'Ritmo medio' : 'Ritmo actual' }}</span>
          </div>
        </section>

        @switch (run.problem()) {
          @case ('denied') {
            <app-notice
              message="Necesitamos tu ubicación para medir el recorrido. Permite el acceso a la ubicación en los ajustes del teléfono y vuelve a intentarlo."
            />
          }
          @case ('unavailable') {
            <app-notice
              tone="info"
              [message]="
                run.status() === 'running'
                  ? 'Buscando señal GPS. Si estás bajo techo, sal a un espacio abierto.'
                  : 'No pudimos activar la ubicación. Revisa que el GPS esté encendido y vuelve a intentarlo.'
              "
            />
          }
        }

        <div class="controls">
          @switch (run.status()) {
            @case ('idle') {
              <p class="hint">Usaremos la ubicación de tu teléfono solo mientras corres.</p>
              <button type="button" class="cta" [disabled]="run.starting()" (click)="run.start()">
                @if (run.starting()) {
                  <ion-spinner name="crescent" aria-hidden="true" /> Activando la ubicación…
                } @else {
                  Empezar <ion-icon name="chevron-forward" aria-hidden="true" />
                }
              </button>
            }
            @case ('running') {
              <button type="button" class="round primary" (click)="run.pause()">
                <ion-icon name="pause" aria-hidden="true" /><span>Pausar</span>
              </button>
              <button type="button" class="round" (click)="run.finish()">
                <ion-icon name="stop" aria-hidden="true" /><span>Terminar</span>
              </button>
            }
            @case ('paused') {
              <button
                type="button"
                class="round primary"
                [disabled]="run.starting()"
                (click)="run.resume()"
              >
                <ion-icon name="play" aria-hidden="true" /><span>Reanudar</span>
              </button>
              <button type="button" class="round" (click)="run.finish()">
                <ion-icon name="stop" aria-hidden="true" /><span>Terminar</span>
              </button>
            }
            @case ('finished') {
              <div class="done">
                <h2>¡Buen entrenamiento!</h2>
                <p>Pronto podrás guardar tus entrenamientos y ver tu historial.</p>
                <button type="button" class="cta" (click)="run.reset()">
                  <ion-icon name="refresh" aria-hidden="true" /> Nuevo entrenamiento
                </button>
              </div>
            }
          }
        </div>
      </div>
    </ion-content>
  `,
  styles: `
    .page {
      display: grid;
      gap: var(--rc-space-lg);
      padding: var(--rc-space-sm) var(--rc-space-lg) var(--rc-space-xxl);
    }

    .map {
      height: 12rem;
    }

    .status {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      margin: 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .dot {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: var(--rc-radius-pill);
      background: var(--rc-control-border);
    }

    .dot.running {
      background: var(--rc-primary);
      box-shadow: 0 0 10px var(--rc-primary);
    }

    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--rc-space-sm);
    }

    .metric {
      display: grid;
      gap: var(--rc-space-xs);
      padding: var(--rc-space-lg);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .metric.time {
      grid-column: 1 / -1;
    }

    .figure {
      font-family: var(--rc-font-family-display);
      font-size: 2.5rem;
      font-weight: 500;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .time .figure {
      font-size: 4.75rem;
    }

    .figure small {
      margin-left: var(--rc-space-xs);
      font-family: var(--rc-font-family);
      font-size: var(--rc-font-size-label);
      font-weight: 500;
      color: var(--rc-text-muted);
    }

    .label {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--rc-space-xl);
    }

    .hint {
      width: 100%;
      margin: 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
      text-align: center;
    }

    button {
      font: inherit;
      cursor: pointer;
    }

    button:disabled {
      cursor: default;
      opacity: 0.7;
    }

    button:focus-visible {
      outline: 3px solid var(--rc-primary-text);
      outline-offset: 3px;
    }

    // The big neon pill: «Empezar »» (dark text on neon, 5.6:1).
    .cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--rc-space-sm);
      width: 100%;
      min-height: 3.75rem;
      padding: 0 var(--rc-space-xl);
      border: 0;
      border-radius: var(--rc-radius-pill);
      background: var(--rc-primary);
      color: var(--rc-on-primary);
      font-size: var(--rc-font-size-subtitle);
      font-weight: 700;
      box-shadow: 0 0 24px color-mix(in srgb, var(--rc-primary) 35%, transparent);
    }

    // Round pause / resume / finish controls with the label inside.
    .round {
      display: grid;
      place-items: center;
      align-content: center;
      gap: 2px;
      width: 5.5rem;
      height: 5.5rem;
      border: 2px solid var(--rc-control-border);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-surface-elevated);
      color: var(--rc-text);
      font-size: var(--rc-font-size-caption);
      font-weight: 600;
    }

    .round ion-icon {
      font-size: 1.75rem;
    }

    .round.primary {
      border-color: var(--rc-primary);
      background: var(--rc-primary);
      color: var(--rc-on-primary);
    }

    .done {
      display: grid;
      gap: var(--rc-space-sm);
      width: 100%;
      text-align: center;
    }

    .done h2 {
      margin: 0;
      font-size: var(--rc-font-size-title);
      font-weight: 600;
    }

    .done p {
      margin: 0 0 var(--rc-space-md);
      color: var(--rc-text-muted);
    }
  `,
})
export class RunPage {
  protected readonly run = inject(RunStore);
  private readonly preferences = inject(PreferencesStore);

  /** The ground covered as neon lines; a pause leaves a gap. */
  protected readonly track = computed(() =>
    this.run.path().map((points): MapLine => ({ points, tone: 'route' })),
  );
  protected readonly here = computed((): MapMarker[] => {
    const position = this.run.position();
    return position ? [{ kind: 'position', at: position }] : [];
  });
  protected readonly statusLabel = computed(() => STATUS_LABELS[this.run.status()]);
  protected readonly time = computed(() => formatDuration(this.run.elapsedMs()));
  protected readonly distance = computed(() =>
    distanceParts(this.run.distanceKm(), this.preferences.preferences().units, 2),
  );
  protected readonly pace = computed(() =>
    paceParts(this.run.paceSecondsPerKm(), this.preferences.preferences().units),
  );
}
