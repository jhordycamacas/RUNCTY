import { Component, input } from '@angular/core';
import { IonContent } from '@ionic/angular';

/** Frame of the screens outside the areas (sign in, sign up, password reset). */
@Component({
  selector: 'app-auth-layout',
  imports: [IonContent],
  template: `
    <ion-content>
      <main class="auth">
        <h1>RUNCTY</h1>
        <p class="tagline">{{ tagline() }}</p>
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

    h1 {
      margin: 0;
      color: var(--rc-primary-text);
      font-size: var(--rc-font-size-display);
    }

    .tagline {
      margin: var(--rc-space-xs) 0 var(--rc-space-xl);
      color: var(--rc-text-muted);
    }
  `,
})
export class AuthLayout {
  readonly tagline = input.required<string>();
}
