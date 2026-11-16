import { Component, input } from '@angular/core';
import { IonContent } from '@ionic/angular';

/** Frame of the screens outside the areas (sign in, sign up, password reset). */
@Component({
  selector: 'app-auth-layout',
  imports: [IonContent],
  template: `
    <ion-content>
      <main class="auth">
        <header class="brand">
          <img class="logo" src="brand/logo.png" alt="" width="104" height="104" />
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
      justify-content: center;
    }

    .brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: var(--rc-space-xxl) 0 var(--rc-space-xl);
      text-align: center;
    }

    .logo {
      width: 104px;
      height: 104px;
      border-radius: var(--rc-radius-lg);
      object-fit: contain;
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
