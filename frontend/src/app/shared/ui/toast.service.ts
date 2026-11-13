import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

const SUCCESS_MS = 4000;

/**
 * App-wide feedback that survives navigation. Success disappears by itself; an error stays until
 * the user closes it, so it cannot be missed. Only one toast is shown at a time.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toasts = inject(ToastController);

  success(message: string): Promise<void> {
    return this.show({
      message,
      color: 'success',
      duration: SUCCESS_MS,
      htmlAttributes: { role: 'status' },
    });
  }

  error(message: string): Promise<void> {
    return this.show({
      message,
      color: 'danger',
      buttons: [{ text: 'Cerrar', role: 'cancel' }],
      htmlAttributes: { role: 'alert' },
    });
  }

  private async show(options: Parameters<ToastController['create']>[0]): Promise<void> {
    await this.toasts.dismiss();
    const toast = await this.toasts.create({ position: 'bottom', ...options });
    await toast.present();
  }
}
