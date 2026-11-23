import { Component, computed, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline } from 'ionicons/icons';
import { userMessage } from '../core/errors/user-message';
import { PreferencesStore } from '../preferences/application/preferences.store';
import { ToastService } from '../shared/ui/toast.service';

addIcons({ moonOutline, sunnyOutline });

/**
 * One icon button that flips the admin between the light and the dark theme: a sun on the dark
 * theme (press for light), a moon on the light one (press for dark). The «system» appearance is
 * resolved to what the device shows, so the first press always lands on the opposite theme. It
 * saves through the preferences of the user, which the store applies to the screen at once.
 */
@Component({
  selector: 'app-theme-selector',
  imports: [IonIcon],
  template: `
    <button type="button" class="toggle" [attr.aria-label]="label()" (click)="toggle()">
      <ion-icon [name]="dark() ? 'sunny-outline' : 'moon-outline'" aria-hidden="true" />
    </button>
  `,
  styles: `
    :host {
      display: inline-block;
    }

    .toggle {
      display: grid;
      place-items: center;
      width: var(--rc-min-touch-target);
      height: var(--rc-min-touch-target);
      padding: 0;
      border: 1px solid var(--rc-control-border);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-surface-elevated);
      color: var(--rc-text);
      font-size: 1.25rem;
      cursor: pointer;
    }

    .toggle:hover {
      background: var(--rc-surface);
    }
  `,
})
export class ThemeSelector {
  protected readonly store = inject(PreferencesStore);
  private readonly toast = inject(ToastService);

  /** What the screen shows now: the system appearance follows the device. */
  protected readonly dark = computed(() => {
    const appearance = this.store.preferences().appearance;
    if (appearance === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return appearance === 'dark';
  });

  protected readonly label = computed(() =>
    this.dark() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro',
  );

  protected async toggle(): Promise<void> {
    try {
      await this.store.save({
        ...this.store.preferences(),
        appearance: this.dark() ? 'light' : 'dark',
      });
    } catch (error) {
      await this.toast.error(userMessage(error));
    }
  }
}
