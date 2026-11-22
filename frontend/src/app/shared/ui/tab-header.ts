import { Component, input } from '@angular/core';
import { IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

/**
 * Header of a runner tab: the floating pill (see `_areas.scss`) with the club logo on the left and
 * the title centered. The logo is decorative; the title names the screen. Both ends are equally
 * wide, so the title stays centered.
 */
@Component({
  selector: 'app-tab-header',
  imports: [IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <img slot="start" class="logo" src="brand/logo.png" alt="" width="40" height="40" />
        <ion-title>{{ title() }}</ion-title>
        <span slot="end" class="balance" aria-hidden="true"></span>
      </ion-toolbar>
    </ion-header>
  `,
  styles: `
    .logo,
    .balance {
      display: block;
      width: 5.5rem;
      height: 2.5rem;
    }

    .logo {
      object-fit: contain;
      object-position: left center;
    }
  `,
})
export class TabHeader {
  readonly title = input.required<string>();
}
