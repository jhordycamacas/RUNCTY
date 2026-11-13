import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

/** Placeholder of an admin section; each one is replaced by its real screen in the admin task. */
@Component({
  selector: 'app-admin-section-placeholder-page',
  imports: [IonButtons, IonContent, IonHeader, IonMenuButton, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Esta sección estará disponible pronto.</p>
    </ion-content>
  `,
})
export class SectionPlaceholderPage {
  protected readonly title = inject(ActivatedRoute).snapshot.data['title'] as string;
}
