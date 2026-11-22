import { Component, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { call } from 'ionicons/icons';
import { ConfirmDialog } from '../shared/ui/confirm-dialog';
import { PhoneDialer } from './phone-dialer';

addIcons({ call });

/** Ecuador's emergency number. */
const EMERGENCY_NUMBER = '911';

/**
 * Always-visible emergency control of the runner area. It asks first, so a stray tap does not
 * start a call, and then opens the phone dialer with 911 (`tel:`). Nothing goes to the server.
 */
@Component({
  selector: 'app-emergency-button',
  imports: [IonIcon],
  template: `
    <button
      type="button"
      class="sos"
      aria-label="SOS, llamar al 911 de emergencias"
      (click)="request()"
    >
      <ion-icon name="call" aria-hidden="true" />
      SOS
    </button>
  `,
  styles: `
    // Centered on the right end of the floating header pill (3.5rem tall, see _areas.scss).
    .sos {
      position: fixed;
      top: calc(var(--ion-safe-area-top, 0px) + var(--rc-space-sm) + (3.5rem - 48px) / 2);
      right: var(--rc-space-md);
      z-index: 1000;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--rc-space-xs);
      min-width: var(--rc-min-touch-target);
      min-height: var(--rc-min-touch-target);
      padding: 0 var(--rc-space-md);
      border: 2px solid var(--rc-surface-elevated);
      border-radius: 999px;
      background: var(--rc-primary);
      color: var(--rc-on-primary);
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 6px rgb(0 0 0 / 30%);
    }

    .sos:active {
      background: var(--rc-primary-pressed);
    }
  `,
})
export class EmergencyButton {
  private readonly confirmDialog = inject(ConfirmDialog);
  private readonly dialer = inject(PhoneDialer);

  protected async request(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      header: '¿Llamar al 911?',
      message:
        'Se abrirá el marcador del teléfono con el número de emergencias 911. Tú decides si realizas la llamada.',
      confirmText: 'Abrir marcador',
      destructive: true,
    });
    if (confirmed) this.dialer.dial(EMERGENCY_NUMBER);
  }
}
