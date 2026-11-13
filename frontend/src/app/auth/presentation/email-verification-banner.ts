import { Component, inject, signal } from '@angular/core';
import { IonButton, IonSpinner } from '@ionic/angular';
import { AuthService } from '../../core/auth/auth.service';
import { FirebaseAuthGateway } from '../../core/auth/firebase-auth.gateway';
import { userMessage } from '../../core/errors/user-message';
import { Notice } from '../../shared/ui/notice';

type Busy = 'resend' | 'check' | null;

interface Feedback {
  tone: 'danger' | 'success' | 'info';
  message: string | null;
}

/**
 * Shown on Home while the email is not verified: resend the message, or re-check after the user
 * opened the link (the check reloads the user and the token, so the banner goes away on its own).
 */
@Component({
  selector: 'app-email-verification-banner',
  imports: [IonButton, IonSpinner, Notice],
  template: `
    @if (session()?.emailVerified === false) {
      <section class="banner" aria-labelledby="verify-title">
        <h2 id="verify-title">Verifica tu correo</h2>
        <p>
          Te enviamos un mensaje a <strong>{{ session()?.email }}</strong>. Abre el enlace para
          confirmar tu cuenta.
        </p>
        <app-notice [tone]="feedback().tone" [message]="feedback().message" />
        <div class="actions">
          <ion-button fill="outline" [disabled]="busy() !== null" (click)="resend()">
            @if (busy() === 'resend') {
              <ion-spinner name="crescent" aria-label="Enviando" />
            } @else {
              Reenviar correo
            }
          </ion-button>
          <ion-button [disabled]="busy() !== null" (click)="check()">
            @if (busy() === 'check') {
              <ion-spinner name="crescent" aria-label="Comprobando" />
            } @else {
              Ya verifiqué
            }
          </ion-button>
        </div>
      </section>
    }
  `,
  styles: `
    .banner {
      padding: var(--rc-space-lg);
      border: 1px solid var(--rc-warning);
      border-radius: var(--rc-radius-md);
      background: var(--rc-warning-tint);
    }

    h2 {
      margin: 0 0 var(--rc-space-xs);
      font-size: var(--rc-font-size-subtitle);
    }

    p {
      margin: 0 0 var(--rc-space-md);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-sm);
      margin-top: var(--rc-space-md);
    }
  `,
})
export class EmailVerificationBanner {
  private readonly auth = inject(AuthService);
  private readonly gateway = inject(FirebaseAuthGateway);

  protected readonly session = this.auth.session;
  protected readonly busy = signal<Busy>(null);
  protected readonly feedback = signal<Feedback>({ tone: 'info', message: null });

  protected async resend(): Promise<void> {
    await this.run('resend', async () => {
      await this.gateway.sendEmailVerification();
      return {
        tone: 'success',
        message: 'Te enviamos un nuevo correo. Revisa también tu carpeta de spam.',
      };
    });
  }

  protected async check(): Promise<void> {
    await this.run('check', async () => {
      await this.auth.refreshSession();
      return this.auth.session()?.emailVerified === false
        ? {
            tone: 'info',
            message:
              'Aún no vemos tu correo verificado. Abre el enlace del mensaje e inténtalo de nuevo.',
          }
        : { tone: 'info', message: null };
    });
  }

  private async run(action: Exclude<Busy, null>, work: () => Promise<Feedback>): Promise<void> {
    if (this.busy()) return;
    this.busy.set(action);
    try {
      this.feedback.set(await work());
    } catch (error) {
      this.feedback.set({ tone: 'danger', message: userMessage(error) });
    } finally {
      this.busy.set(null);
    }
  }
}
