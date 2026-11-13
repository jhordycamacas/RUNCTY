import { Component, input, output } from '@angular/core';

export interface ChipOption {
  value: string;
  label: string;
}

/**
 * Single-choice filter as a row of chips that scrolls sideways instead of wrapping, so several
 * filters stay on screen at once. Exposed to assistive technology as a radio group.
 */
@Component({
  selector: 'app-choice-chips',
  template: `
    <div class="group" role="radiogroup" [attr.aria-label]="label()">
      <span class="caption" aria-hidden="true">{{ label() }}</span>
      <div class="row">
        @for (option of options(); track option.value) {
          <button
            type="button"
            role="radio"
            class="chip"
            [class.selected]="option.value === value()"
            [attr.aria-checked]="option.value === value()"
            (click)="selected.emit(option.value)"
          >
            {{ option.label }}
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: var(--rc-space-md);
    }

    .caption {
      display: block;
      margin-bottom: var(--rc-space-xs);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .row {
      display: flex;
      flex-wrap: nowrap;
      gap: var(--rc-space-sm);
      overflow-x: auto;
      padding-bottom: var(--rc-space-xs);
      scrollbar-width: none;
    }

    .row::-webkit-scrollbar {
      display: none;
    }

    .chip {
      flex: none;
      min-height: var(--rc-min-touch-target);
      padding: 0 var(--rc-space-lg);
      border: 1px solid var(--rc-control-border);
      border-radius: 999px;
      background: var(--rc-surface-elevated);
      color: var(--rc-text);
      font: inherit;
      font-size: var(--rc-font-size-label);
      cursor: pointer;
    }

    .chip.selected {
      border-color: var(--rc-primary-text);
      background: var(--rc-primary-tint);
      color: var(--rc-primary-text);
      font-weight: 600;
    }
  `,
})
export class ChoiceChips {
  readonly label = input.required<string>();
  readonly options = input.required<readonly ChipOption[]>();
  readonly value = input<string | null>(null);
  readonly selected = output<string>();
}
