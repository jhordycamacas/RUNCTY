import { Component, input } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { BrandLogo } from '../../shared/ui/brand-logo';

/** Frame of the screens outside the areas (sign in, sign up, password reset). */
@Component({
  selector: 'app-auth-layout',
  imports: [BrandLogo, IonContent],
  template: `
    <ion-content>
      <main class="auth">
        <header class="brand">
          <app-brand-logo size="6.5rem" />
          <h1>RUNCTY</h1>
          <p class="slogan">Corre más seguro</p>
          <p class="tagline">{{ tagline() }}</p>
        </header>
        <ng-content />
      </main>
    </ion-content>
  `,
  styles: `
    /* A wrapper inside the routed page: let ion-content fill the ion-page flex column. */
    :host {
      display: contents;
    }

    .auth {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      max-width: 28rem;
      margin: 0 auto;
      padding: var(--rc-space-xl);
      // There is no header here: the frame itself clears the status bar and the gesture bar.
      padding-top: calc(var(--rc-space-xl) + var(--ion-safe-area-top, 0px));
      padding-bottom: calc(var(--rc-space-xl) + var(--ion-safe-area-bottom, 0px));
      justify-content: center;
    }

    .brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: var(--rc-space-xxl) 0 var(--rc-space-xl);
      text-align: center;
    }

    h1 {
      margin: var(--rc-space-md) 0 0;
      color: var(--rc-text);
      font-size: var(--rc-font-size-display);
      font-weight: 700;
    }

    .slogan {
      margin: 0;
      color: var(--rc-primary-text);
      font-size: var(--rc-font-size-subtitle);
      font-weight: 600;
    }

    .tagline {
      margin: var(--rc-space-sm) 0 0;
      color: var(--rc-text-muted);
    }
  `,
})
export class AuthLayout {
  readonly tagline = input.required<string>();
}
