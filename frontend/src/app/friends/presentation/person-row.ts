import { Component, input } from '@angular/core';
import { Avatar } from '../../shared/ui/avatar';

/** One person of a list: avatar, name and an optional detail, with the actions projected. */
@Component({
  selector: 'app-person-row',
  imports: [Avatar],
  template: `
    <app-avatar [name]="name()" size="3rem" />
    <div class="who">
      <strong>{{ name() }}</strong>
      @if (detail(); as text) {
        <span class="detail">{{ text }}</span>
      }
    </div>
    <div class="actions"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--rc-space-md);
      padding: var(--rc-space-md);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .who {
      display: grid;
      flex: 1 1 8rem;
      min-width: 0;
    }

    strong {
      overflow-wrap: anywhere;
      font-weight: 600;
    }

    .detail {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-caption);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--rc-space-sm);
    }
  `,
})
export class PersonRow {
  /** Full name; the avatar initials come from it. */
  readonly name = input.required<string>();
  readonly detail = input<string | null>(null);
}
