import { Component, input } from '@angular/core';
import { IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

/**
 * Header of a runner tab: a clean bar on the page color (see `_areas.scss`) with the club logo
 * and a large left-aligned title. The logo is decorative; the title names the screen.
 */
@Component({
  selector: 'app-tab-header',
  imports: [IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <img slot="start" class="logo" src="brand/logo.png" alt="" width="40" height="40" />
        <ion-title>{{ title() }}</ion-title>
      </ion-toolbar>
    </ion-header>
  `,
  styles: `
    // The logo file has a white background, so it sits in a white round badge on the dark bar.
    .logo {
      display: block;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--rc-radius-pill);
      background: #ffffff;
      object-fit: cover;
    }

    ion-title {
      padding-inline: var(--rc-space-md);
      text-align: start;
    }
  `,
})
export class TabHeader {
  readonly title = input.required<string>();
}
