import { Component, input } from '@angular/core';
import { IonBackButton, IonButtons, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

/** Header of a screen reached from a list: back button and title. */
@Component({
  selector: 'app-subpage-header',
  imports: [IonBackButton, IonButtons, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="backTo()" text="" aria-label="Volver" />
        </ion-buttons>
        <ion-title>{{ title() }}</ion-title>
      </ion-toolbar>
    </ion-header>
  `,
})
export class SubpageHeader {
  readonly title = input.required<string>();
  readonly backTo = input('/app/cuenta');
}
