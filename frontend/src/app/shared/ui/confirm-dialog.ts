import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';

export interface ConfirmOptions {
  header: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  /** Styles the confirm button as a destructive action. */
  destructive?: boolean;
}

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
}
