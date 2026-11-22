import { Component, inject, signal } from '@angular/core';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { mailUnreadOutline } from 'ionicons/icons';
import { AuthService } from '../../core/auth/auth.service';
import { FirebaseAuthGateway } from '../../core/auth/firebase-auth.gateway';
import { userMessage } from '../../core/errors/user-message';
import { Notice } from '../../shared/ui/notice';

addIcons({ mailUnreadOutline });

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
  imports: [IonButton, IonIcon, IonSpinner, Notice],
  template: `
    @if (session()?.emailVerified === false) {
      <section class="banner" aria-labelledby="verify-title">
        <ion-icon class="icon" name="mail-unread-outline" aria-hidden="true" />
        <div class="text">
          <h2 id="verify-title">Verifica tu correo</h2>
          <p>{{ session()?.email }}</p>
        </div>
        <div class="actions">
          <ion-button fill="clear" [disabled]="busy() !== null" (click)="resend()">
            @if (busy() === 'resend') {
              <ion-spinner name="crescent" aria-label="Enviando" />
            } @else {
              Reenviar
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
        <app-notice class="feedback" [tone]="feedback().tone" [message]="feedback().message" />
      </section>
    }
  `,
  styles: `
    // One compact row (icon, the title with the address under it, two small pills); the pills
    // drop below the text only when the row does not fit. The pills keep the 48px touch target.
    .banner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--rc-space-xs) var(--rc-space-sm);
      padding: var(--rc-space-xs) var(--rc-space-xs) var(--rc-space-xs) var(--rc-space-md);
      border-radius: var(--rc-radius-md);
      background: var(--rc-warning-tint);
    }

    .icon {
      flex: none;
      color: var(--rc-warning);
      font-size: 1.25rem;
    }

    .text {
      flex: 1 1 7.5rem;
      min-width: 0;
    }

    h2 {
      margin: 0;
      font-size: var(--rc-font-size-label);
      font-weight: 600;
      line-height: 1.25;
    }

    p {
      margin: 0;
      overflow: hidden;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-caption);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      display: flex;
      flex: none;
      gap: var(--rc-space-xs);
      margin-left: auto;
    }

    ion-button {
      --border-radius: var(--rc-radius-pill);
      --padding-start: var(--rc-space-md);
      --padding-end: var(--rc-space-md);
      min-height: var(--rc-min-touch-target);
      margin: 0;
      font-size: var(--rc-font-size-caption);
      font-weight: 600;
    }

    .feedback {
      flex-basis: 100%;
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
