import { Component, inject, input } from '@angular/core';
import { userMessage } from '../core/errors/user-message';
import { PreferencesStore } from '../preferences/application/preferences.store';
import { APPEARANCES, APPEARANCE_LABELS, Appearance } from '../preferences/domain/preferences';
import { ToastService } from '../shared/ui/toast.service';

/**
 * Light, dark or system theme for the admin. It saves through the preferences of the user, which
 * the store applies to the screen at once, so the choice also follows the user to the next visit.
 */
@Component({
  selector: 'app-theme-selector',
  template: `
    <label class="field" [class.compact]="compact()">
      <span class="label">Tema</span>
      <select [value]="store.preferences().appearance" (change)="choose($event)">
        @for (option of options; track option.value) {
          <option [value]="option.value" [selected]="option.value === store.preferences().appearance">
            {{ option.label }}
          </option>
        }
      </select>
    </label>
  `,
  styles: `
    :host {
      display: block;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-xs);
    }

    .compact {
      flex-direction: row;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    // In the top bar the select is a white pill, like the other actions there.
    .compact select {
      width: auto;
      padding: 0 var(--rc-space-lg);
      border-radius: var(--rc-radius-pill);
    }

    .label {
      color: var(--label-color, var(--rc-text-muted));
      font-size: var(--rc-font-size-caption);
    }

    select {
      width: 100%;
      min-height: var(--rc-min-touch-target);
      padding: 0 var(--rc-space-md);
      border: 1px solid var(--rc-control-border);
      border-radius: var(--rc-radius-sm);
      background: var(--rc-surface-elevated);
      color: var(--rc-text);
      font: inherit;
    }
  `,
})
export class ThemeSelector {
  /** One row with the label beside the select, for a top bar. */
  readonly compact = input(false);

  protected readonly store = inject(PreferencesStore);
  private readonly toast = inject(ToastService);

  protected readonly options = APPEARANCES.map((value) => ({
    value,
    label: APPEARANCE_LABELS[value],
  }));

  protected async choose(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const preferences = this.store.preferences();
    try {
      await this.store.save({ ...preferences, appearance: select.value as Appearance });
    } catch (error) {
      select.value = preferences.appearance;
      await this.toast.error(userMessage(error));
    }
  }
}
