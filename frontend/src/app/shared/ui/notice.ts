import { Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
} from 'ionicons/icons';

addIcons({ alertCircleOutline, checkmarkCircleOutline, informationCircleOutline });

export type NoticeTone = 'danger' | 'success' | 'info';

const ICONS: Record<NoticeTone, string> = {
  danger: 'alert-circle-outline',
  success: 'checkmark-circle-outline',
  info: 'information-circle-outline',
};

/**
 * Inline message under a form or a heading. Nothing is rendered without a message. Errors use
 * `role="alert"` (announced at once); the rest use `role="status"`.
 */
@Component({
  selector: 'app-notice',
  imports: [IonIcon],
  template: `
    @if (message(); as text) {
      <p class="notice" [class]="tone()" [attr.role]="tone() === 'danger' ? 'alert' : 'status'">
        <ion-icon [name]="icon()" aria-hidden="true" />
        <span>{{ text }}</span>
      </p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .notice {
      display: flex;
      align-items: flex-start;
      gap: var(--rc-space-sm);
      margin: 0;
      padding: var(--rc-space-md);
      border-radius: var(--rc-radius-md);
      color: var(--rc-text);
      font-size: var(--rc-font-size-label);
    }

    ion-icon {
      flex: none;
      margin-top: 2px;
      font-size: 1.25rem;
    }

    .danger {
      background: var(--rc-danger-tint);
    }

    .danger ion-icon {
      color: var(--rc-danger);
    }

    .success {
      background: var(--rc-success-tint);
    }

    .success ion-icon {
      color: var(--rc-success);
    }

    .info {
      background: var(--rc-surface);
    }

    .info ion-icon {
      color: var(--rc-primary-text);
    }
  `,
})
export class Notice {
  readonly message = input<string | null | undefined>(null);
  readonly tone = input<NoticeTone>('danger');
  protected readonly icon = computed(() => ICONS[this.tone()]);
}
