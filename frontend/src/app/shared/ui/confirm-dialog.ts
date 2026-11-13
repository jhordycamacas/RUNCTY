import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { userMessage } from '../../core/errors/user-message';

export interface ConfirmOptions {
  header: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  /** Styles the confirm button as a destructive (danger) action. */
  destructive?: boolean;
}

export interface ConfirmActionOptions extends ConfirmOptions {
  /**
   * The action behind the confirm button. While it runs the dialog cannot be closed (Esc,
   * backdrop, Cancel); if it throws, the dialog stays open and shows the error.
   */
  run(): Promise<void>;
}

const PENDING_MESSAGE = 'Procesando…';

/** Native-looking confirmation before an irreversible or disruptive action. */
@Injectable({ providedIn: 'root' })
export class ConfirmDialog {
  private readonly alerts = inject(AlertController);

  async confirm(options: ConfirmOptions): Promise<boolean> {
    const alert = await this.alerts.create({
      header: options.header,
      message: options.message,
      buttons: [
        { text: options.cancelText ?? 'Cancelar', role: 'cancel' },
        {
          text: options.confirmText,
          role: 'confirm',
          cssClass: options.destructive ? 'alert-destructive' : undefined,
        },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  /** Confirms, then runs the action inside the dialog. Resolves `true` once the action succeeded. */
  async confirmAction(options: ConfirmActionOptions): Promise<boolean> {
    let pending = false;
    let succeeded = false;

    const alert = await this.alerts.create({
      header: options.header,
      message: options.message,
      backdropDismiss: true,
      buttons: [
        // No `cancel` role: that role closes the dialog without asking the handler.
        { text: options.cancelText ?? 'Cancelar', handler: () => !pending },
        {
          text: options.confirmText,
          cssClass: options.destructive ? 'alert-destructive' : undefined,
          handler: async () => {
            if (pending) return false;
            pending = true;
            // Esc, the Android back button and the backdrop all honour this flag.
            alert.backdropDismiss = false;
            alert.message = PENDING_MESSAGE;
            try {
              await options.run();
              succeeded = true;
              return true;
            } catch (error) {
              pending = false;
              alert.backdropDismiss = true;
              alert.message = userMessage(error);
              return false;
            }
          },
        },
      ],
    });
    await alert.present();
    await alert.onDidDismiss();
    return succeeded;
  }
}
