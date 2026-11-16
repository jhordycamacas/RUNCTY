import { Component, input } from '@angular/core';
import { SafetyBadge } from '../../../routes/presentation/safety-badge';
import { SlotLevel } from '../domain/slot-safety';

/** The safety level (Alto, Medio, Bajo) of a route or segment for each of its time slots. */
@Component({
  selector: 'app-slot-safety-list',
  imports: [SafetyBadge],
  template: `
    @if (levels().length > 0) {
      <ul [attr.aria-label]="label()">
        @for (slot of levels(); track slot.key) {
          <li>
            <span class="time">{{ slot.label }}</span>
            @if (slot.level; as level) {
              <app-safety-badge [level]="level" [compact]="true" />
            } @else {
              <span class="unrated">Sin evaluar</span>
            }
          </li>
        }
      </ul>
    } @else {
      <p class="unrated">Sin franjas horarias</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-sm) var(--rc-space-lg);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: inline-flex;
      align-items: center;
      gap: var(--rc-space-xs);
    }

    .time {
      font-size: var(--rc-font-size-label);
      font-variant-numeric: tabular-nums;
    }

    .unrated {
      margin: 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }
  `,
})
export class SlotSafetyList {
  readonly levels = input.required<readonly SlotLevel[]>();
  readonly label = input('Nivel de seguridad por franja horaria');
}
